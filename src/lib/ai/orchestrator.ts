import { generateText, stepCountIs, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { AGENTS } from "./agents";
import type { Session } from "next-auth";

const ORCHESTRATOR_SYSTEM_PROMPT = `Sei l'AI Orchestrator di BOLERO, il gestionale interno di
un'azienda che si occupa di montaggio, tende, pergole e pergotende. Parli in italiano, in modo
diretto e professionale.

Tu stesso non hai strumenti per leggere o modificare dati: il tuo compito è capire cosa serve
all'utente e delegare al sub-agent specializzato giusto tramite lo strumento "delegate".
Agenti disponibili:
${AGENTS.map((a) => `- ${a.name}: ${a.description}`).join("\n")}

Puoi delegare più volte in sequenza se la richiesta tocca più aree (es. prima al sales agent
per trovare il cliente, poi al calendar agent per fissare l'appuntamento). Dopo aver ricevuto
le risposte dei sub-agent, sintetizza per l'utente in 2-4 frasi cosa hai scoperto o proposto.
Se un sub-agent ha creato una proposta in attesa di conferma, invita l'utente a confermarla o
modificarla dall'interfaccia: non puoi eseguirla tu.`;

function extractPendingActionIds(steps: Awaited<ReturnType<typeof generateText>>["steps"]) {
  const ids: string[] = [];
  for (const step of steps) {
    for (const toolResult of step.toolResults) {
      const output = toolResult.output as { pending?: boolean; actionId?: string } | undefined;
      if (output?.pending && output.actionId) ids.push(output.actionId);
    }
  }
  return ids;
}

export type OrchestratorResult = {
  reply: string;
  pendingActionIds: string[];
};

export async function runOrchestrator(
  message: string,
  session: Session["user"]
): Promise<OrchestratorResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI non configurata: manca ANTHROPIC_API_KEY nel file .env. Vedi Impostazioni → Integrazioni."
    );
  }

  const anthropic = createAnthropic({ apiKey });
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";
  const model = anthropic(modelId);

  const pendingActionIds: string[] = [];

  const delegateTool = tool({
    description:
      "Delega un compito a un sub-agent specializzato e restituisce la sua risposta.",
    inputSchema: z.object({
      agent: z.enum(AGENTS.map((a) => a.name) as [string, ...string[]]),
      task: z
        .string()
        .describe("Descrizione chiara e autosufficiente del compito da svolgere"),
    }),
    execute: async ({ agent: agentName, task }) => {
      const agent = AGENTS.find((a) => a.name === agentName);
      if (!agent) return { error: `Agente sconosciuto: ${agentName}` };

      const subResult = await generateText({
        model,
        system: agent.systemPrompt,
        prompt: task,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: agent.buildTools(session) as any,
        stopWhen: stepCountIs(4),
      });

      pendingActionIds.push(...extractPendingActionIds(subResult.steps));

      return { agent: agentName, reply: subResult.text };
    },
  });

  const result = await generateText({
    model,
    system: ORCHESTRATOR_SYSTEM_PROMPT,
    prompt: message,
    tools: { delegate: delegateTool },
    stopWhen: stepCountIs(6),
  });

  return { reply: result.text, pendingActionIds };
}
