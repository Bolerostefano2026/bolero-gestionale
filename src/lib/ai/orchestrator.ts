import { generateText, stepCountIs, tool } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { AGENTS } from "./agents";
import type { Session } from "next-auth";

function buildSystemPrompt() {
  const now = new Date();
  const dataOra = now.toLocaleString("it-CH", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });
  return `Sei l'AI Orchestrator di BOLERO, il gestionale interno di
un'azienda che si occupa di montaggio, tende, pergole e pergotende. Parli in italiano, in modo
diretto e professionale.

Data e ora attuale: ${dataOra} (fuso orario Europa/Zurigo)

Tu stesso non hai strumenti per leggere o modificare dati: il tuo compito è capire cosa serve
all'utente e delegare al sub-agent specializzato giusto tramite lo strumento "delegate".
Agenti disponibili:
${AGENTS.map((a) => `- ${a.name}: ${a.description}`).join("\n")}

Puoi delegare più volte in sequenza se la richiesta tocca più aree (es. prima al sales agent
per trovare il cliente, poi al calendar agent per fissare l'appuntamento). Dopo aver ricevuto
le risposte dei sub-agent, sintetizza per l'utente in 2-4 frasi cosa hai scoperto o proposto.
Se un sub-agent ha creato una proposta in attesa di conferma, invita l'utente a confermarla o
modificarla dall'interfaccia: non puoi eseguirla tu.`;
}

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
  tokens: { input: number; output: number };
};

export async function runOrchestrator(
  message: string,
  session: Session["user"]
): Promise<OrchestratorResult> {
  // Usa Anthropic se disponibile (produzione), Ollama come fallback locale
  const useAnthropic = !!process.env.ANTHROPIC_API_KEY;
  let model;
  if (useAnthropic) {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    model = anthropic("claude-haiku-4-5-20251001");
  } else {
    const ollamaBase = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
    const modelId = process.env.OLLAMA_MODEL ?? "llama3.1:latest";
    const ollama = createOpenAI({ baseURL: ollamaBase, apiKey: "ollama" });
    model = ollama(modelId);
  }

  const pendingActionIds: string[] = [];
  // I sub-agent fanno chiamate proprie: i token vanno sommati a quelli
  // dell'orchestratore, altrimenti il consumo reale resta invisibile.
  const tokens = { input: 0, output: 0 };

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

      tokens.input += subResult.usage?.inputTokens ?? 0;
      tokens.output += subResult.usage?.outputTokens ?? 0;
      pendingActionIds.push(...extractPendingActionIds(subResult.steps));

      return { agent: agentName, reply: subResult.text };
    },
  });

  const result = await generateText({
    model,
    system: buildSystemPrompt(),
    prompt: message,
    tools: { delegate: delegateTool },
    stopWhen: stepCountIs(6),
  });

  tokens.input += result.usage?.inputTokens ?? 0;
  tokens.output += result.usage?.outputTokens ?? 0;

  return { reply: result.text, pendingActionIds, tokens };
}
