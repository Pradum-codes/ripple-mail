type SummaryField = {
  label: string;
  value: string | number | boolean;
};

export type LoadSummary = {
  simulation: string;
  jobsCreated: number;
  completed: number;
  delayed: number;
  failed: number;
  waiting: number;
  active: number;
  executionTimeMs: number;
  workers: number;
  concurrency: number;
  enqueueDurationMs?: number;
  extraFields?: SummaryField[];
};

export function printLoadSummary(summary: LoadSummary): void {
  const lines: string[] = [
    "",
    "============================",
    "LOAD TEST SUMMARY",
    "============================",
    `Simulation: ${summary.simulation}`,
    `Jobs Created: ${summary.jobsCreated}`,
    `Completed: ${summary.completed}`,
    `Delayed: ${summary.delayed}`,
    `Failed: ${summary.failed}`,
    `Waiting: ${summary.waiting}`,
    `Active: ${summary.active}`,
    `Execution Time: ${summary.executionTimeMs} ms`,
    `Workers: ${summary.workers}`,
    `Concurrency: ${summary.concurrency}`,
  ];

  if (summary.enqueueDurationMs !== undefined) {
    lines.push(`Enqueue Duration: ${summary.enqueueDurationMs} ms`);
  }

  for (const field of summary.extraFields ?? []) {
    lines.push(`${field.label}: ${field.value}`);
  }

  console.log(lines.join("\n"));
}
