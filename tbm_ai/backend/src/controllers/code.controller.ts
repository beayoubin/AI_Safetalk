import { Request, Response } from "express";
import {
  listCodeApprovalStatuses,
  listCodeRiskLevels,
  listCodeWorkCategories,
  listCodeWorkTypes,
  parsePermitTypes
} from "../repositories/code-work-type.repository";
import {
  listCodeWorkShifts,
  listTbmSurveyOptions,
  listTbmSurveyQuestions
} from "../repositories/tbm-survey-option.repository";

export const getCodeWorkTypes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await listCodeWorkTypes();
    res.json({
      ok: true,
      rows: rows.map((row) => ({
        code: row.work_type_code,
        name: row.work_type,
        permitTypes: parsePermitTypes(row.permit_types)
      }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const getCodeOptions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      categoryRows,
      workTypeRows,
      riskLevels,
      approvalStatuses,
      workShifts,
      surveyQuestions,
      surveyOptions
    ] = await Promise.all([
      listCodeWorkCategories(),
      listCodeWorkTypes(),
      listCodeRiskLevels(),
      listCodeApprovalStatuses(),
      listCodeWorkShifts(),
      listTbmSurveyQuestions(),
      listTbmSurveyOptions()
    ]);

    const workTypes = workTypeRows.map((row) => ({
      code: row.work_type_code,
      name: row.work_type,
      categoryCode: row.category_code,
      permitTypes: parsePermitTypes(row.permit_types)
    }));

    // 작업종류를 대분류(작업 카테고리) 아래 소분류로 묶어, 화면에서 2단계(대분류 -> 소분류)로 선택할 수 있게 한다.
    const workCategories = categoryRows.map((category) => ({
      code: category.category_code,
      name: category.category_name,
      workTypes: workTypes.filter((workType) => workType.categoryCode === category.category_code)
    }));

    // 작업종류를 아직 선택하지 않은 초기 화면 등을 위해, 전체 작업종류의 허가유형을 중복 제거해 함께 내려준다.
    // 실제 화면에서는 선택된 작업종류의 permitTypes만 사용해 목록을 필터링해야 한다.
    const permitTypes = Array.from(
      new Set(workTypes.flatMap((workType) => workType.permitTypes))
    ).sort();

    res.json({
      ok: true,
      workCategories,
      workTypes,
      riskLevels: riskLevels.map((row) => row.risk_level),
      workShifts: workShifts.map((row) => row.shift_name),
      tbmSurvey: {
        questions: surveyQuestions.map((row) => ({
          key: row.question_key,
          label: row.label,
          outputLabel: row.output_label,
          helperText: row.helper_text
        })),
        options: surveyOptions.map((row) => ({
          questionKey: row.question_key,
          driverType: row.driver_type,
          driverValue: row.driver_value,
          label: row.option_label
        }))
      },
      permitTypes,
      approvalStatuses: approvalStatuses.map((row) => row.approval_status)
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
