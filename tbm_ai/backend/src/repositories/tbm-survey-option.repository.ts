import { dbPool } from "../../config/database";

export type CodeWorkShiftRow = {
  shift_name: string;
};

export type TbmSurveyQuestionRow = {
  question_key: string;
  label: string;
  output_label: string;
  helper_text: string;
  display_order: number;
};

export type TbmSurveyOptionRow = {
  question_key: string;
  driver_type: string;
  driver_value: string;
  option_label: string;
  display_order: number;
};

let schemaReady = false;

const ensureTbmSurveyOptionSchema = async (): Promise<void> => {
  if (schemaReady) return;

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_work_shift (
      shift_code VARCHAR(20) PRIMARY KEY,
      shift_name VARCHAR(50) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y'
    )
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_tbm_survey_question (
      question_key VARCHAR(50) PRIMARY KEY,
      label VARCHAR(100) NOT NULL,
      output_label VARCHAR(100) NOT NULL,
      helper_text VARCHAR(255) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y'
    )
  `);

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_tbm_survey_option (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question_key VARCHAR(50) NOT NULL,
      driver_type VARCHAR(30) NOT NULL,
      driver_value VARCHAR(50) NOT NULL,
      option_label VARCHAR(120) NOT NULL,
      display_order INT NOT NULL DEFAULT 0,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y',
      UNIQUE KEY uq_tbm_survey_option (question_key, driver_type, driver_value, option_label)
    )
  `);

  schemaReady = true;
};

export const listCodeWorkShifts = async (): Promise<CodeWorkShiftRow[]> => {
  await ensureTbmSurveyOptionSchema();

  const [rows] = await dbPool.query(
    `
      SELECT shift_name
      FROM code_work_shift
      WHERE active_yn = 'Y'
      ORDER BY display_order ASC
    `
  );
  return rows as CodeWorkShiftRow[];
};

export const listTbmSurveyQuestions = async (): Promise<TbmSurveyQuestionRow[]> => {
  await ensureTbmSurveyOptionSchema();

  const [rows] = await dbPool.query(
    `
      SELECT question_key, label, output_label, helper_text, display_order
      FROM code_tbm_survey_question
      WHERE active_yn = 'Y'
      ORDER BY display_order ASC
    `
  );
  return rows as TbmSurveyQuestionRow[];
};

export const listTbmSurveyOptions = async (): Promise<TbmSurveyOptionRow[]> => {
  await ensureTbmSurveyOptionSchema();

  const [rows] = await dbPool.query(
    `
      SELECT question_key, driver_type, driver_value, option_label, display_order
      FROM code_tbm_survey_option
      WHERE active_yn = 'Y'
      ORDER BY question_key ASC, driver_type ASC, driver_value ASC, display_order ASC
    `
  );
  return rows as TbmSurveyOptionRow[];
};
