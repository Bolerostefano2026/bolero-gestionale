import { SALES_AGENT } from "./sales";
import { CALENDAR_AGENT } from "./calendar";
import { WORKFLOW_AGENT } from "./workflow";
import { ADMIN_AGENT } from "./admin";

export const AGENTS = [SALES_AGENT, CALENDAR_AGENT, WORKFLOW_AGENT, ADMIN_AGENT] as const;

export type AgentName = (typeof AGENTS)[number]["name"];
