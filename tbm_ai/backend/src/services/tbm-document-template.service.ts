export type TbmDocumentKind = "script" | "minutes" | "bundle";

export type TbmDocumentData = {
  title: string;
  preset: {
    workType: string;
    permitType: string;
    risk: string;
    shift: string;
    workDate: string;
    location: string;
  };
  userPrompt: string;
  draftText: string;
  createdAt: string;
};

type ScriptTemplateItem = {
  title: string;
  subtitle?: string;
};

const SCRIPT_TEMPLATE: ScriptTemplateItem[] = [
  { title: "인사" },
  { title: "건강" },
  { title: "작업" },
  { title: "위험" },
  { title: "조치" },
  { title: "사례" },
  { title: "의견" },
  { title: "비상" },
  { title: "지적확인" }
];

const MINUTES_SECTION_LABELS = [
  "잠재위험요인",
  "중점위험요인",
  "대책",
  "작업 전 안전조치 확인",
  "작업 후 종료 미팅",
  "참석자 확인"
] as const;

const SCRIPT_SECTION_ALIAS_MAP: Record<string, string[]> = {
  인사: ["1. 인사", "작업장소 이동", "작업장소이동", "체조 및 스트레칭"],
  건강: ["2. 건강", "건강상태 확인", "건강상태"],
  작업: ["3. 작업", "작업내용 공유", "작업내용", "작업내용, 위험요인, 작업절차 확인"],
  위험: ["4. 위험", "핵심 위험요인", "잠재위험요인"],
  조치: ["5. 조치", "안전조치 확인", "보호구 착용상태 확인", "보호구", "PPE", "보호구 착용"],
  사례: ["6. 사례", "유사 사고사례", "유사 사고 사례", "사고사례", "중점위험요인"],
  의견: ["7. 의견", "의견 및 질의응답", "질의응답", "질의 응답", "Q&A", "작업 후 종료 미팅"],
  비상: ["8. 비상", "비상대피요령", "비상대피", "비상 시 대피요령", "기상 특보 대응"],
  지적확인: ["9. 지적확인", "숙지여부 확인", "속지여부 확인", "체크리스트/서명"]
};

const MINUTES_SECTION_ALIAS_MAP: Record<string, string[]> = {
  잠재위험요인: ["위험", "4. 위험", "핵심 위험요인", "잠재위험요인"],
  중점위험요인: ["사례", "6. 사례", "사고사례", "중점위험요인"],
  대책: ["조치", "5. 조치", "통제조치", "대책"],
  "작업 전 안전조치 확인": ["체크리스트/서명", "작업 전 안전조치 확인", "PPE", "LOTO"],
  "작업 후 종료 미팅": ["의견", "7. 의견", "작업 후 종료 미팅"],
  "참석자 확인": ["지적확인", "9. 지적확인", "참석자 확인"]
};

const splitDraftBlocks = (draft: string): string[] =>
  draft
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

const extractPrimaryScriptText = (draft: string): string => {
  const startMarker = "## 2. TBM 대본(생성 결과)";
  const fallbackEndMarkers = ["\n=== 구분선 ===", "\n# TBM 회의록", "\n## 1. 회의 개요"];

  let body = draft;
  const startIndex = draft.indexOf(startMarker);
  if (startIndex >= 0) {
    body = draft.slice(startIndex + startMarker.length).trim();
  }

  let endIndex = body.length;
  for (const marker of fallbackEndMarkers) {
    const idx = body.indexOf(marker);
    if (idx >= 0 && idx < endIndex) {
      endIndex = idx;
    }
  }

  return body.slice(0, endIndex).trim();
};

const cleanPreviewContent = (value: string): string => {
  const cleaned = value
    .split("\n")
    .map((line) =>
      line
        .replace(/^>+\s*/, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\*+\s*/, "")
        .replace(/^-\s*/, "")
        .replace(/^\[\s*[xX ]?\s*\]\s*/, "")
        .replace(/^\[[^\]]+\]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/\*+/g, "")
        .replace(/["“”]/g, "")
        .replace(/[^\S\r\n]{2,}/g, " ")
        .trimEnd()
    )
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^#{1,6}\s*(tbm|tool\s*box|회의록|대본)/i.test(trimmed)) return false;
      if (/^(tbm\s*대본|tbm\s*회의록|tool\s*box\s*meeting)$/i.test(trimmed)) return false;
      if (/^safety logic check$/i.test(trimmed)) return false;
      if (/^rag 근거$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .trim();

  const paragraphSeen = new Set<string>();
  const dedupedParagraphs = cleaned
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter((line, index, arr) => line !== "" && arr.indexOf(line) === index)
        .join("\n")
        .trim()
    )
    .filter((paragraph) => {
      if (!paragraph) return false;
      const normalized = paragraph.replace(/\s+/g, " ").trim();
      if (paragraphSeen.has(normalized)) return false;
      paragraphSeen.add(normalized);
      return true;
    });

  return normalizeTbmSpeechTone(dedupedParagraphs.join("\n\n")).trim();
};

const toPoliteControlSentence = (value: string): string => {
  const phrase = value.trim().replace(/[.!?。]+$/g, "");
  if (!phrase) return "";
  if (/(합니다|바랍니다|습니까)$/.test(phrase)) return `${phrase}.`;
  const controlMap: Record<string, string> = {
    "작업장 주변 인화물 제거": "작업장 주변 인화물을 제거해 주시기 바랍니다.",
    "소화기 2대 이상 비치": "소화기 2대 이상을 비치해 주시기 바랍니다.",
    "화기감시자 배치": "화기감시자를 배치해 주시기 바랍니다.",
    "작업 후 잔불 확인": "작업 후 잔불을 확인해 주시기 바랍니다.",
    "전원 차단 및 LOTO 실시": "전원을 차단하고 LOTO를 실시해 주시기 바랍니다.",
    "검전기로 무전압 확인": "검전기로 무전압 상태를 확인해 주시기 바랍니다.",
    "절연보호구 착용": "절연보호구를 착용해 주시기 바랍니다.",
    "접지 상태 확인": "접지 상태를 확인해 주시기 바랍니다."
  };
  if (controlMap[phrase]) return controlMap[phrase];
  if (/(확인|착용|배치|비치|제거|실시)$/.test(phrase)) return `${phrase}해 주시기 바랍니다.`;
  return `${phrase}을 확인해 주시기 바랍니다.`;
};

const normalizeControlListTone = (value: string): string => {
  const parts = value
    .split(/[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 1) return value;
  return parts.map(toPoliteControlSentence).filter(Boolean).join(" ");
};

const normalizeTbmSpeechTone = (value: string): string =>
  normalizeControlListTone(value)
    .replace(/화재 관련 화재/g, "화재 위험")
    .replace(/감전 관련 감전/g, "감전 위험")
    .replace(/보고되었다/g, "보고되었습니다")
    .replace(/발생했다/g, "발생했습니다")
    .replace(/사망했다/g, "사망했습니다")
    .replace(/부상을 입었다/g, "부상을 입었습니다")
    .replace(/화상을 입었다/g, "화상을 입었습니다")
    .replace(/있음/g, "있습니다")
    .replace(/필요하다/g, "필요합니다")
    .replace(/해야 한다/g, "해야 합니다")
    .replace(/하여야 한다/g, "해야 합니다")
    .replace(/([가-힣]+)한다(?=[.!?]|$)/g, "$1합니다")
    .replace(/있다(?=[.!?]|$)/g, "있습니다")
    .replace(/된다(?=[.!?]|$)/g, "됩니다")
    .replace(/이다(?=[.!?]|$)/g, "입니다");

const normalizeSectionLabel = (value: string): string =>
  value
    .replace(/\(.*?\)/g, "")
    .replace(/[\[\]【】]/g, "")
    .replace(/[：:]/g, "")
    .replace(/\s+/g, "")
    .trim();

const normalizeHeadingLine = (line: string): string =>
  line
    .replace(/^>+\s*/, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+\s*[.)]\s*/, "")
    .replace(/^[\-*•]\s*/, "")
    .trim();

const detectSectionFromAliasMap = (
  line: string,
  aliasMap: Record<string, string[]>
): string | null => {
  const normalizedLine = normalizeSectionLabel(normalizeHeadingLine(line));
  if (!normalizedLine) return null;

  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    const candidates = [canonical, ...aliases];
    const matched = candidates.some((candidate) => {
      const normalizedCandidate = normalizeSectionLabel(candidate);
      return (
        normalizedLine === normalizedCandidate || normalizedLine.startsWith(normalizedCandidate)
      );
    });
    if (matched) return canonical;
  }
  return null;
};

const extractSectionMapByAliases = (
  draft: string,
  aliasMap: Record<string, string[]>
): Record<string, string> => {
  const labels = Object.keys(aliasMap);
  const map = Object.fromEntries(labels.map((label) => [label, ""])) as Record<string, string>;
  const buckets = Object.fromEntries(labels.map((label) => [label, [] as string[]])) as Record<
    string,
    string[]
  >;

  let activeLabel: string | null = null;
  draft.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    const label = detectSectionFromAliasMap(line, aliasMap);
    if (label) {
      activeLabel = label;
      return;
    }
    if (activeLabel) {
      buckets[activeLabel].push(rawLine.trimEnd());
    }
  });

  labels.forEach((label) => {
    map[label] = buckets[label]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  });

  return map;
};

const buildScriptSectionFallback = (title: string, detail: TbmDocumentData): string => {
  const location = detail.preset.location || "작업장소";
  const workType = detail.preset.workType || "해당";
  const workDate = detail.preset.workDate || "오늘";
  const risk = detail.preset.risk || "해당";

  switch (title) {
    case "인사":
      return `안녕하십니까. 오늘 TBM을 시작하겠습니다.\n오늘 ${location}에서 ${workType} 작업을 수행합니다.\n작업 전 간단히 목, 어깨, 허리, 하체 순서로 스트레칭을 진행해 몸을 풀겠습니다.\n스트레칭 후 장비와 보호구를 최종 점검하고 작업구역으로 이동하겠습니다.`;
    case "건강":
      return `작업 시작 전에 건강상태를 확인하겠습니다.\n전날 음주, 수면 부족, 두통, 어지럼증, 근육통 등 이상 증상이 있는 분은 즉시 말씀해 주세요.\n몸 상태가 좋지 않으면 무리해서 작업하지 말고 역할을 조정하겠습니다.\n본인 컨디션이 팀 전체 안전과 직결되므로 서로 확인 후 작업에 들어가겠습니다.`;
    case "작업":
      return `오늘 작업 내용을 설명드리겠습니다. 오늘은 ${workDate}, ${location}에서 ${workType} 작업을 실시합니다.\n작업허가서와 작업범위를 확인하고 역할을 공유합니다.\n단계별 작업을 순서대로 진행하면서 이상징후 발생 시 즉시 작업중지 후 보고합니다.\n작업 종료 후 잔존 위험요인을 재점검하고 정리 상태 확인 후 철수합니다.`;
    case "위험":
      return `위험등급은 ${risk}이며, 작업 구역 특성상 잠재위험이 있으므로 절대 방심하지 마세요.\n주요 위험요인은 작업 대상 설비 및 주변 잔류 위험요인, 작업 중 비산물 및 접촉 위험, 정리 미흡으로 인한 2차 사고 위험입니다.\n위험징후가 보이면 즉시 작업을 멈추고 주변 작업자에게 알려 주세요.`;
    case "조치":
      return `안전조치 사항을 확인하겠습니다.\n보호구 착용상태를 상호 확인하고, 작업허가서와 통제구역 상태를 확인해 주세요.\nLOTO, 소화기, 신호수 배치 등 해당 작업에 필요한 조치가 완료되었는지 다시 한 번 확인하겠습니다.`;
    case "사례":
      return `유사 사고사례를 공유하겠습니다.\n유사한 ${workType} 작업에서 작업 전 확인 부족과 안전조치 미준수로 사고가 발생한 사례가 있습니다.\n같은 사고가 반복되지 않도록 작업 전 확인과 상호 점검을 철저히 해 주세요.`;
    case "의견":
      return `의견 및 질의응답 시간입니다.\n오늘 작업내용, 위험요인, 안전조치 중 이해가 되지 않거나 추가로 확인할 사항이 있으면 말씀해 주세요.\n작업 중에도 의문사항이나 위험요인을 발견하면 즉시 공유해 주세요.`;
    case "비상":
      return `비상상황 발생 시 즉시 작업을 중지하고 주변에 상황을 전파해 주세요.\n가장 가까운 안전한 대피경로로 이동하고, 지정 집결지에서 인원을 확인하겠습니다.\n응급상황은 즉시 119 신고 및 현장 안전관리자에게 보고하겠습니다.\n무리한 단독 조치는 금지하며, 인명 안전을 최우선으로 대응하겠습니다.`;
    case "지적확인":
      return `지금 설명한 작업내용과 위험요인, 통제조치 내용을 모두 숙지하셨는지 확인하겠습니다.\n작업 전 확인해야 할 핵심 항목과 작업중지 기준을 질문드리면 답변 부탁드립니다.\n모두 숙지 확인 후 지적확인을 진행하겠습니다.`;
    default:
      return "";
  }
};

const ensureWorkLocationIntro = (content: string, detail: TbmDocumentData): string => {
  const location = detail.preset.location.trim();
  const workType = detail.preset.workType.trim();
  const hasLocation = location !== "" && content.includes(location);
  const hasWorkType = workType !== "" && content.includes(workType);
  if (hasLocation && hasWorkType) return content;
  const introLine = `오늘 ${location || "작업장소"}에서 ${workType || "해당"} 작업을 수행합니다.`;
  return `${introLine}\n${content}`.trim();
};

export type TbmPreviewBundleData = {
  scriptSections: Array<{ title: string; subtitle?: string; content: string }>;
  minutesRows: Array<{ label: string; content: string }>;
  summary: {
    workDate: string;
    shift: string;
    workName: string;
    location: string;
    risk: string;
  };
};

export const buildPreviewBundleData = (detail: TbmDocumentData): TbmPreviewBundleData => {
  const primaryScriptText = extractPrimaryScriptText(detail.draftText);
  const scriptSectionMap = extractSectionMapByAliases(primaryScriptText, SCRIPT_SECTION_ALIAS_MAP);
  const minutesSectionMap = extractSectionMapByAliases(
    primaryScriptText,
    MINUTES_SECTION_ALIAS_MAP
  );
  const draftBlocks = splitDraftBlocks(primaryScriptText).map((block) =>
    cleanPreviewContent(block)
  );

  const scriptSections = SCRIPT_TEMPLATE.map((section) => {
    const idx = SCRIPT_TEMPLATE.findIndex((item) => item.title === section.title);
    let content =
      cleanPreviewContent(scriptSectionMap[section.title] || "") || draftBlocks[idx] || "";
    if (!content) {
      content = buildScriptSectionFallback(section.title, detail);
    }
    if (section.title === "인사") {
      content = ensureWorkLocationIntro(content, detail);
    }
    return {
      ...section,
      content: cleanPreviewContent(content)
    };
  });

  const minutesRows = MINUTES_SECTION_LABELS.map((label, index) => ({
    label,
    content:
      cleanPreviewContent(minutesSectionMap[label] || "") ||
      draftBlocks[SCRIPT_TEMPLATE.length + index] ||
      "해당 회의록 내용이 여기에 표시됩니다."
  }));

  return {
    scriptSections,
    minutesRows,
    summary: {
      workDate: detail.preset.workDate || "____년 __월 __일",
      shift: detail.preset.shift || "근무조 미선택",
      workName: `${detail.preset.workType || "작업종류 미선택"} / ${detail.preset.permitType || "허가유형 미선택"}`,
      location: detail.preset.location || "작업장소 미선택",
      risk: detail.preset.risk || "위험등급 미선택"
    }
  };
};

export const buildScriptTemplate = (detail: TbmDocumentData): string =>
  [
    `# TBM 대본`,
    ``,
    `## 1. 기본 정보`,
    `- 제목: ${detail.title}`,
    `- 작업종류: ${detail.preset.workType}`,
    `- 허가유형: ${detail.preset.permitType}`,
    `- 위험등급: ${detail.preset.risk}`,
    `- 작업시간: ${detail.preset.shift}`,
    `- 작업일: ${detail.preset.workDate}`,
    `- 작업장소: ${detail.preset.location}`,
    `- 생성시각: ${detail.createdAt}`,
    ``,
    `## 2. TBM 대본(생성 결과)`,
    detail.draftText,
    ``
  ].join("\n");

export const buildMinutesTemplate = (detail: TbmDocumentData): string =>
  [
    `# TBM 회의록`,
    ``,
    `## 1. 회의 개요`,
    `- 회의명: ${detail.title}`,
    `- 작업종류: ${detail.preset.workType}`,
    `- 작업일시: ${detail.preset.workDate} / ${detail.preset.shift}`,
    `- 작업장소: ${detail.preset.location}`,
    `- 위험등급: ${detail.preset.risk}`,
    ``,
    `## 2. 참석자`,
    `- 진행자: (입력 필요)`,
    `- 작업책임자: (입력 필요)`,
    `- 참석 작업자: (입력 필요)`,
    ``,
    `## 3. 주요 브리핑 내용(요약)`,
    `- 아래 대본 내용을 기준으로 핵심 전달사항을 요약합니다.`,
    ``,
    `> 원문 대본`,
    `>`,
    ...detail.draftText.split("\n").map((line) => `> ${line}`),
    ``,
    `## 4. 위험요인 및 조치 확인`,
    `- 위험요인 확인: [ ] 완료`,
    `- PPE 착용 확인: [ ] 완료`,
    `- LOTO 점검 확인: [ ] 완료`,
    `- 비상대응 절차 공유: [ ] 완료`,
    ``,
    `## 5. 작업자 의견 및 특이사항`,
    `- 의견 1:`,
    `- 의견 2:`,
    ``,
    `## 6. 지적확인 및 서명`,
    `- 오늘의 위험 포인트:`,
    `- 오늘의 안전 목표:`,
    `- 진행자 서명:`,
    `- 작업책임자 서명:`,
    ``
  ].join("\n");

export const buildBundleContent = (detail: TbmDocumentData, kind: TbmDocumentKind): string => {
  const scriptMarkdown = buildScriptTemplate(detail);
  const minutesMarkdown = buildMinutesTemplate(detail);
  if (kind === "script") {
    return scriptMarkdown;
  }
  if (kind === "minutes") {
    return minutesMarkdown;
  }
  return [scriptMarkdown, "\n=== 구분선 ===\n", minutesMarkdown].join("\n");
};
