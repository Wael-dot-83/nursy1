import { Request, Response } from "express";
import { z } from "zod";
import { createReport, listReports } from "../services/reportService";
import { unauthorized } from "../utils/errors";

const reportSchema = z.object({
  childId: z.string().uuid(),
  weekStart: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "weekStart must be a valid date string",
  }),
  weekEnd: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "weekEnd must be a valid date string",
  }),
  summary: z.string().min(1),
  highlights: z.string().optional().nullable(),
  nextSteps: z.string().optional().nullable(),
});

export async function createReportHandler(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const body = reportSchema.parse(req.body);
  const report = await createReport(req.user, body);
  return res.status(201).json(report);
}

export async function getReports(req: Request, res: Response) {
  if (!req.user) {
    throw unauthorized();
  }
  const querySchema = z.object({
    childId: z.string().uuid().optional(),
  });
  const query = querySchema.parse(req.query);
  const reports = await listReports(req.user, query);
  return res.json(reports);
}
