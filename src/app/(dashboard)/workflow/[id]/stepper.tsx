import { Check } from "lucide-react";
import { WORKFLOW_STAGES } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function WorkflowStepper({ currentStage }: { currentStage: string }) {
  const currentIndex = WORKFLOW_STAGES.findIndex((s) => s.value === currentStage);

  return (
    <ol className="flex flex-col gap-0">
      {WORKFLOW_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === WORKFLOW_STAGES.length - 1;

        return (
          <li key={stage.value} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                  done && "border-success bg-success text-white",
                  active && "border-copper bg-copper-bg text-copper",
                  !done && !active && "border-fog bg-surface text-ink3"
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1 min-h-[14px]",
                    done ? "bg-success" : "bg-fog"
                  )}
                />
              )}
            </div>
            <div className={cn("pb-3.5 text-sm", active ? "font-semibold text-ink" : "text-ink2")}>
              {stage.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
