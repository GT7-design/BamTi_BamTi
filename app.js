// [보안 점검용 주석]
// 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있다.
// 2. Gemini API 호출은 Vercel Serverless Function에서 처리한다.
// 3. .env 파일은 GitHub에 올리지 않는다.
// 4. Vercel 배포 시에는 Project Settings의 Environment Variables에 GEMINI_API_KEY를 등록해야 한다.
// 5. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소 정보로 제한한다.

const USERS = [
  { id: "admin", password: "2026", role: "admin", name: "관리자" },
  { id: "10101", password: "1234", role: "student", studentId: "10101" },
  { id: "10102", password: "1234", role: "student", studentId: "10102" },
  { id: "10103", password: "1234", role: "student", studentId: "10103" },
];

const STUDENTS = [
  {
    id: "10101",
    name: "김코딩",
    photo: "assets/10101_김코딩.jpg",
    grades: {
      "정보 수행평가": "A",
      "웹앱 프로젝트": "92점",
      "디지털 윤리 퀴즈": "88점",
      "수업 참여도": "상",
    },
    traits: [
      "문제 해결 과정을 차분히 설명합니다.",
      "새 도구를 시도할 때 기록을 꼼꼼히 남깁니다.",
      "제출 전 확인 습관을 더 연습하면 좋습니다.",
    ],
    teacherMemo: "프론트엔드 구조 이해가 빠르며, 팀원 질문에 답하는 태도가 좋습니다.",
  },
  {
    id: "10102",
    name: "박개발",
    photo: "assets/10102_박개발.jpg",
    grades: {
      "정보 수행평가": "B+",
      "웹앱 프로젝트": "86점",
      "디지털 윤리 퀴즈": "91점",
      "수업 참여도": "중상",
    },
    traits: [
      "협업 중 역할 분담을 잘 지킵니다.",
      "UI 수정 아이디어를 자주 제안합니다.",
      "프로젝트 범위를 작게 나누는 연습이 필요합니다.",
    ],
    teacherMemo: "기능 구현 의욕이 높고, 오류가 날 때 원인을 함께 추적하려는 태도가 좋습니다.",
  },
  {
    id: "10103",
    name: "이교사",
    photo: "assets/10103_이교사.jpg",
    grades: {
      "정보 수행평가": "A-",
      "웹앱 프로젝트": "89점",
      "디지털 윤리 퀴즈": "95점",
      "수업 참여도": "상",
    },
    traits: [
      "학습 내용을 자기 언어로 정리합니다.",
      "개선할 지점을 발견하면 근거를 함께 제시합니다.",
      "코드 주석을 더 구체적으로 쓰면 좋습니다.",
    ],
    teacherMemo: "질문의 초점이 좋고, 개선 방향을 토의하는 데 적극적입니다.",
  },
];

const loginForm = document.querySelector("#loginForm");
const userIdInput = document.querySelector("#userId");
const passwordInput = document.querySelector("#password");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const loginView = document.querySelector("#loginView");
const studentView = document.querySelector("#studentView");
const adminView = document.querySelector("#adminView");

let currentUser = null;

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const id = userIdInput.value.trim();
  const password = passwordInput.value;
  const user = USERS.find((item) => item.id === id && item.password === password);

  if (!user) {
    loginMessage.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  currentUser = user;
  loginMessage.textContent = "";
  loginForm.reset();

  if (user.role === "admin") {
    renderAdminDashboard();
  } else {
    const student = STUDENTS.find((item) => item.id === user.studentId);
    renderStudentPage(student);
  }
});

logoutButton.addEventListener("click", () => {
  currentUser = null;
  showOnly(loginView);
  logoutButton.classList.add("hidden");
  userIdInput.focus();
});

function showOnly(targetView) {
  [loginView, studentView, adminView].forEach((view) => view.classList.add("hidden"));
  targetView.classList.remove("hidden");
}

function renderStudentPage(student) {
  if (!student) {
    loginMessage.textContent = "학생 정보를 찾을 수 없습니다.";
    showOnly(loginView);
    return;
  }

  studentView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Student</p>
        <h2>${student.name} 학생 페이지</h2>
        <p>로그인한 학생의 학습 현황을 확인합니다.</p>
      </div>
    </div>

    <div class="student-layout">
      <article class="student-profile">
        <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
        <div class="profile-body">
          <h3>${student.name}</h3>
          <p class="student-number">학번 ${student.id}</p>
          <div class="tag-row" aria-label="학습 키워드">
            <span class="tag">정보</span>
            <span class="tag">프로젝트</span>
          </div>
        </div>
      </article>

      <div class="content-stack">
        ${renderGrades(student.grades, false, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
      </div>
    </div>
  `;

  showOnly(studentView);
  logoutButton.classList.remove("hidden");
}

function renderAdminDashboard() {
  adminView.innerHTML = `
    <div class="view-header">
      <div class="view-title">
        <p class="eyebrow">Admin</p>
        <h2>관리자 대시보드</h2>
        <p>학생 3명의 학습 현황을 한 화면에서 비교합니다.</p>
      </div>
    </div>

    <section class="admin-grid" aria-label="전체 학생 정보">
      ${STUDENTS.map(renderStudentCard).join("")}
    </section>

    <section id="aiCounselingSection" class="ai-counseling-panel hidden" aria-labelledby="aiCounselingTitle">
      <div class="section-title">
        <h3 id="aiCounselingTitle">AI 학생 상담 전략 도우미</h3>
      </div>
      
      <div class="ai-panel-body">
        <div class="selected-student-info">
          <h4>선택된 학생 (화면 표시용 - 원본 데이터)</h4>
          <p id="counselScreenInfo">학생을 선택해주세요.</p>
        </div>

        <div class="teacher-input-area">
          <label for="teacherConcern">상담 고민 입력</label>
          <textarea id="teacherConcern" rows="3" placeholder="예: 수업 참여는 좋은데 평가 결과가 낮습니다. 어떻게 상담하면 좋을까요?"></textarea>
        </div>

        <div class="preview-area">
          <h4>전송 데이터 미리보기 (Gemini 전송용 - 익명화 데이터)</h4>
          <pre id="counselPreviewData">데이터가 없습니다.</pre>
        </div>

        <button id="requestAiButton" class="primary-button ai-request-btn">AI 상담 전략 받기</button>
        
        <div id="aiResponseArea" class="ai-response-area hidden"></div>
        <p class="ai-notice">AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다.</p>
      </div>
    </section>
  `;

  showOnly(adminView);
  logoutButton.classList.remove("hidden");

  attachAdminEventListeners();
}

let selectedCounselStudent = null;

function attachAdminEventListeners() {
  const requestButtons = adminView.querySelectorAll('.request-counsel-btn');
  const aiSection = adminView.querySelector('#aiCounselingSection');
  const screenInfo = adminView.querySelector('#counselScreenInfo');
  const previewData = adminView.querySelector('#counselPreviewData');
  const concernInput = adminView.querySelector('#teacherConcern');
  const requestAiButton = adminView.querySelector('#requestAiButton');
  const responseArea = adminView.querySelector('#aiResponseArea');

  requestButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      const studentId = e.target.getAttribute('data-id');
      const student = STUDENTS.find(s => s.id === studentId);
      if (student) {
        selectedCounselStudent = {
          student,
          alias: "학생 " + String.fromCharCode(65 + index) // A, B, C...
        };
        
        aiSection.classList.remove('hidden');
        aiSection.scrollIntoView({ behavior: 'smooth' });
        
        screenInfo.textContent = `이름: ${student.name}, 학번: ${student.id}`;
        updatePreviewData();
        responseArea.classList.add('hidden');
        responseArea.innerHTML = '';
      }
    });
  });

  concernInput.addEventListener('input', updatePreviewData);

  function updatePreviewData() {
    if (!selectedCounselStudent) return;
    
    const gradesValues = Object.entries(selectedCounselStudent.student.grades).map(([k,v]) => `${k}: ${v}`).join(', ');
    const traits = selectedCounselStudent.student.traits.join(' / ');
    
    const previewObj = {
      studentAlias: selectedCounselStudent.alias,
      gradeSummary: `성적: ${gradesValues}`,
      learningTraits: `특성: ${traits}, 메모: ${selectedCounselStudent.student.teacherMemo}`,
      teacherConcern: concernInput.value.trim()
    };
    
    previewData.textContent = JSON.stringify(previewObj, null, 2);
  }

  requestAiButton.addEventListener('click', async () => {
    const concern = concernInput.value.trim();
    if (!concern) {
      alert("상담 고민을 먼저 입력해주세요.");
      return;
    }
    
    if (!selectedCounselStudent) return;

    responseArea.classList.remove('hidden');
    responseArea.classList.remove('error-message');
    responseArea.innerHTML = '<em>AI가 상담 전략을 생성하는 중입니다...</em>';
    requestAiButton.disabled = true;

    const gradesValues = Object.entries(selectedCounselStudent.student.grades).map(([k,v]) => `${k}: ${v}`).join(', ');
    const traits = selectedCounselStudent.student.traits.join(' / ');
    const payload = {
      studentAlias: selectedCounselStudent.alias,
      gradeSummary: `성적: ${gradesValues}`,
      learningTraits: `특성: ${traits}, 메모: ${selectedCounselStudent.student.teacherMemo}`,
      teacherConcern: concern
    };

    try {
      const res = await fetch('/api/gemini-counseling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        responseArea.innerHTML = data.result.replace(/\n/g, '<br>');
      } else {
        responseArea.classList.add('error-message');
        responseArea.innerHTML = `AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.<br><small>(${data.error})</small>`;
      }
    } catch (err) {
      responseArea.classList.add('error-message');
      responseArea.innerHTML = "AI 상담 전략을 불러오지 못했습니다. API 키 또는 Vercel 환경 변수를 확인해주세요.";
    } finally {
      requestAiButton.disabled = false;
    }
  });
}

function renderStudentCard(student) {
  return `
    <article class="student-card">
      <img class="student-photo" src="${student.photo}" alt="${student.name} 학생 사진" />
      <div class="student-card-body">
        <h3>${student.name}</h3>
        <p class="student-number">학번 ${student.id}</p>
        ${renderGrades(student.grades, true, `gradesTitle-${student.id}`)}
        ${renderTraits(student)}
        <div style="margin-top: 16px;">
          <button class="ghost-button request-counsel-btn" style="width: 100%;" data-id="${student.id}">상담 전략 요청</button>
        </div>
      </div>
    </article>
  `;
}

function renderGrades(grades, compact = false, headingId = "gradesTitle") {
  const rows = Object.entries(grades)
    .map(([label, value]) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`)
    .join("");

  return `
    <section aria-labelledby="${headingId}">
      <div class="section-title">
        <h3 id="${headingId}">성적 정보</h3>
      </div>
      <table class="grade-table ${compact ? "compact-table" : ""}">
        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderTraits(student) {
  return `
    <section aria-labelledby="traitsTitle-${student.id}">
      <div class="section-title">
        <h3 id="traitsTitle-${student.id}">학습 특성 및 교사 메모</h3>
      </div>
      <ul class="memo-list">
        ${student.traits.map((trait) => `<li>${trait}</li>`).join("")}
        <li>${student.teacherMemo}</li>
      </ul>
    </section>
  `;
}

showOnly(loginView);
