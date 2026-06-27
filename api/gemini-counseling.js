// Gemini API 호출은 Vercel Serverless Function에서 처리한다.
// 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
// .env 파일은 GitHub에 올리지 않는다.
// Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST 요청만 지원합니다.' });
  }

  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;

  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: '필수 데이터가 누락되었습니다.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  const prompt = `
당신은 "AI 학생 상담 전략 도우미"입니다. 교사가 특정 학생과 상담을 준비할 때 필요한 전략과 조언을 제공합니다.
단, 학생을 단정적으로 판단하거나 진단하지 않아야 합니다. (예: "의지가 부족하다", "주의력 문제가 있다", "심리적 문제가 있다" 등의 표현 금지)
교사가 학생을 긍정적으로 이해하고 대화할 수 있도록 돕는 방향으로 작성해주세요.

다음은 해당 학생의 익명화된 정보와 교사의 고민입니다.

- 학생 이름: ${studentAlias}
- 성적 요약: ${gradeSummary}
- 학습 특성: ${learningTraits}
- 교사 고민: ${teacherConcern}

위 정보를 바탕으로 아래 형식에 맞추어 마크다운 없이 일반 텍스트 또는 가벼운 리스트(번호, 하이픈)로 상담 전략을 제안해주세요.

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.');
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error('Gemini로부터 유효한 응답을 받지 못했습니다.');
    }

    return res.status(200).json({ success: true, result: resultText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
