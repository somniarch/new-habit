'use client';

import React, { useState, useEffect } from "react";
import Image from "next/image"; 
import WeeklySummary from "@/components/ui/WeeklySummary";
import { signIn, signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import HomeClientPage from "@/components/HomeClientPage";
type Routine = {
  date: string; 
  day: string;
  start: string;
  end: string;
  task: string;
  done: boolean;
  rating: number;
  isHabit?: boolean;
};

const habitCandidates = ["깊은 숨 2분", "물 한잔", "짧은 산책", "스트레칭"];
const fullDays = ["월", "화", "수", "목", "금", "토", "일"];

function getEncouragementAndHabit(task: string) {
  const lower = task.toLowerCase();
  if (lower.includes("study") || lower.includes("read")) {
    return {
      emoji: "📚",
      msg: "학습에 집중했네요!",
      habitSuggestion: "5분간 뇌 휴식을 가져보세요",
    };
  }
  if (lower.includes("exercise") || lower.includes("walk")) {
    return {
      emoji: "🏃‍♂️",
      msg: "멋진 운동이에요!",
      habitSuggestion: "운동 후 수분 보충을 해보세요",
    };
  }
  if (lower.includes("meditate") || lower.includes("breathing")) {
    return {
      emoji: "🧘‍♀️",
      msg: "마음이 차분해지네요!",
      habitSuggestion: "명상 후 가벼운 스트레칭을 해보세요",
    };
  }
  return {
    emoji: "🎉",
    msg: "잘 해냈어요!",
    habitSuggestion: "물 한잔 마시기",
  };
}



function formatDiaryDate(day: string, baseDate: Date, dayIndex: number) {
  const firstDayOfWeek = new Date(baseDate);
  firstDayOfWeek.setDate(baseDate.getDate() - baseDate.getDay() + dayIndex + 1);
  const yy = String(firstDayOfWeek.getFullYear()).slice(2);
  const mm = String(firstDayOfWeek.getMonth() + 1).padStart(2, "0");
  const dd = String(firstDayOfWeek.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}(${day})`;
}

function warmSummary(entries: string[]) {
  if (entries.length < 5) return "";
  const firstFive = entries.slice(0, 5);
  return `오늘 당신은 ${firstFive.join(", ")} 등 다양한 일과를 멋지게 해냈어요.\n작은 습관 하나하나가 큰 변화를 만들어가고 있답니다.\n이 페이스를 유지하며 행복한 하루하루 보내길 응원할게요!`;
}



export default function Page() {
  // 1. 상태 선언 (useState 등)
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const isLoggedIn = status === "authenticated";
  const [selectedTab, setSelectedTab] = useState<"routine-habit" | "tracker" | "today-diary">("routine-habit");
  const [newRoutine, setNewRoutine] = useState({ start: "08:00", end: "09:00", task: "" });
  const [habitSuggestionIdx, setHabitSuggestionIdx] = useState<number | null>(null);
  const [todayDiaryLogs, setTodayDiaryLogs] = useState<Record<string, string[]>>({});
  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const [currentDate] = useState(new Date());
  const { data: routines = [], mutate: reloadRoutines } = useSWR<Routine[]>("/api/routines", fetcher);
  const [diarySummariesAI, setDiarySummariesAI] = useState<Record<string, string>>({});
  const [diaryImagesAI, setDiaryImagesAI] = useState<Record<string, string>>({});
  const [generated5, setGenerated5] = useState<Record<string, boolean>>({});
  const [generated10, setGenerated10] = useState<Record<string, boolean>>({});
  const [aiHabitSuggestions, setAiHabitSuggestions] = useState<string[]>([]);
  const [aiHabitLoading, setAiHabitLoading] = useState(false);
  const [aiHabitError, setAiHabitError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [selectedDay, setSelectedDay] = useState(fullDays[0]);
  const [toast, setToast] = useState<{ message: string; emoji: string } | null>(null);


  // 2. 함수 선언(핸들러 등) - "실행"하는 코드 넣으면 안 됨
  const handleLogin = async () => {
    setAuthError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) setAuthError(" 실패: " + res.error);
  };

  const handleLogout = () => signOut();

  const addHabitBetween = async (idx: number, habit: string) => {
    if (!isLoggedIn) return alert(" 후 이용해주세요.");
    const today = new Date(currentDate);
    const dayIdx = fullDays.indexOf(selectedDay);
    const realDate = new Date(today);
    realDate.setDate(today.getDate() - today.getDay() + (dayIdx + 1));
    const isoDate = realDate.toISOString().split("T")[0];
    const habitRoutine: Routine = {
      date: isoDate,
      day: selectedDay,
      start: "(습관)",
      end: "",
      task: habit,
      done: false,
      rating: 0,
      isHabit: true,
    };
    const updated = [
      ...routines.slice(0, idx + 1),
      habitRoutine,
      ...routines.slice(idx + 1),
    ];
    await fetch('/api/routines', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routines: updated }),
    });
    reloadRoutines();
    setHabitSuggestionIdx(null);
  };






// CSV 다운로드 함수
const handleExportCSV = () => {
  const headers = ["Date","Day","Start","End","Task","Done","Rating","IsHabit"];
  const rows = routines.map(r => [
    r.date,
    r.day,
    r.start,
    r.end,
    `"${r.task.replace(/"/g,'""')}"`,
    r.done ? "Yes" : "No",
    String(r.rating),
    r.isHabit ? "Yes" : "No"
  ]);

  const csv = [headers, ...rows]
    .map(r => r.join(","))
    .join("\n");

  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "all_habit_logs.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};





  // ✏️ handleAddRoutine 함수 정의 (맨 위쪽 함수 목록 안에 넣어주세요)
  const handleAddRoutine = async () => {
  if (!isLoggedIn) {
    alert("로그인 후 이용해주세요.");
    return;
  }
  if (!newRoutine.task.trim()) return;

  const today = new Date(currentDate);
  const dayIdx = fullDays.indexOf(selectedDay);
  const realDate = new Date(today);
  realDate.setDate(today.getDate() - today.getDay() + (dayIdx + 1));
  const isoDate = realDate.toISOString().split("T")[0];
  const newRoutineObj = {
    date: isoDate,
    day: selectedDay,
    start: newRoutine.start,
    end: newRoutine.end,
    task: newRoutine.task,
    done: false,
    rating: 0,
    isHabit: false,
  };
  await fetch('/api/routines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRoutineObj),
  });
  reloadRoutines();
  setNewRoutine({ start: "08:00", end: "09:00", task: "" });
};


    

 const toggleDone = async (idx: number) => {
   if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
   const updated = [...routines];
   updated[idx] = { ...updated[idx], done: !updated[idx].done };
   await fetch('/api/routines', {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ routines: updated }),
   });
   reloadRoutines();
 if (!updated[idx].done) return;
 const { emoji, msg } = getEncouragementAndHabit(updated[idx].task);
 setToast({ emoji, message: `${msg} "${updated[idx].task}"!` });
 setHabitSuggestionIdx(idx);
 setTodayDiaryLogs((prev) => {
   const dayLogs = prev[updated[idx].day] || [];
   if (!dayLogs.includes(updated[idx].task)) {
     return {
       ...prev,
       [updated[idx].day]: [...dayLogs, updated[idx].task],
     };
   }
   return prev;
 });
  };

   const setRating = async (idx: number, rating: number) => {
   if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
   const updated = [...routines];
   updated[idx] = { ...updated[idx], rating };
   await fetch('/api/routines', {
     method: 'PATCH',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ routines: updated }),
   });
   reloadRoutines();
 }

    async function fetchHabitSuggestions(
  prevTask: string | null,
  nextTask: string | null
): Promise<string[]> {
  setAiHabitLoading(true);
  setAiHabitError(null);

  try {
    const res = await fetch("/openai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prevTask, nextTask }),
    });

    // 먼저 HTTP 상태 체크
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Error ${res.status}`);
    }

    // 순수 텍스트로 받기
    const data = await res.json();
    console.log("[fetchHabitSuggestions] JSON response:", data);

    // result가 배열이 아니면 오류
    if (!data.result || !Array.isArray(data.result)) {
      throw new Error("추천 결과 포맷이 올바르지 않습니다.");
    }

    // 번호 제거 및 개수 제한
    let suggestions = data.result
      .map((item: string) => item.replace(/^\s*\d+\)\s*/, ""))
      .slice(0, 5);      // 최대 5개
    // 최소 3개가 되도록 기본 후보로 채워넣기
    if (suggestions.length < 3) {
      const fill = habitCandidates.filter(h => !suggestions.includes(h));
      suggestions = suggestions.concat(fill.slice(0, 3 - suggestions.length));
    }
    return suggestions;


  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "추천 중 오류 발생";
    setAiHabitError(msg);
    // fallback
    return habitCandidates.slice(0, 3);
  } finally {
    setAiHabitLoading(false);
  }
}

  const handleFetchHabitSuggestions = async (idx: number) => {
  if (!isLoggedIn) {
    alert("로그인 후 이용해주세요.");
    return;
  }
  const prevTask = idx > 0 ? routines[idx - 1].task : null;
  const nextTask = idx < routines.length - 1 ? routines[idx + 1].task : null;

  const suggestions = await fetchHabitSuggestions(prevTask, nextTask);
  setAiHabitSuggestions(suggestions);
  setHabitSuggestionIdx(idx);
};

async function generateSummaryAI(_day: string, _tasks: string[]): Promise<string> {
  try {
    const prompt = `다음은 사용자의 오늘 달성한 습관 및 일과 목록입니다:\n${_tasks.join(", ")}\n이 내용을 바탕으로 따뜻하고 긍정적인 응원의 메시지와 함께 짧게 요약해 주세요.`;
    const res = await fetch("/api/openai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Summary AI error:", data);
      return "";
    }
    return data.result || "";
  } catch (e) {
    console.error(e);
    return "";
  }
}

async function generateImageAI(promptBase: string, _tasks: string[]): Promise<string> {
  try {
    const activities = _tasks.join(", ");
    const prompt = 
`A warm, cozy colored pencil illustration with soft textures and subtle shading, resembling hand-drawn diary art.
Gentle, muted colors like orange, yellow, brown, and green.
The composition should feel peaceful and heartwarming, like a moment captured in a personal journal.
No humans should appear in the image.
The drawing should evoke quiet satisfaction and mindfulness.

🎯 Focus on: ${promptBase}
📝 Activities today: ${activities}`;


    const res = await fetch("/openai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Image AI error:", data);
      return "";
    }
    return data.imageUrl || "";
  } catch (e) {
    console.error(e);
    return "";
  }
}

useEffect(() => {
  (async () => {
    for (const day of fullDays) {
      // ──────────────────────────────────────────────────────────────
      // ① ISO 날짜 문자열 계산
      // ──────────────────────────────────────────────────────────────
      const dayIdx = fullDays.indexOf(day);
      const d = new Date(currentDate);
      d.setDate(
        currentDate.getDate() -
          currentDate.getDay() +
          (dayIdx + 1)
      );
      const iso = d.toISOString().split("T")[0];

      // ──────────────────────────────────────────────────────────────
      // ② completedTasks 계산
      // ──────────────────────────────────────────────────────────────
      const completed = routines
        .filter(r => r.date === iso && r.done)
        .map(r => r.task);
      const count = completed.length;

      if (count >= 5 && !generated5[day]) {
        setGenerated5(prev => ({ ...prev, [day]: true }));
        const summary = await generateSummaryAI(iso, completed);
        setDiarySummariesAI(prev => ({ ...prev, [iso]: summary }));
        const doneEntries = routines.filter(r => r.day === day && r.done);
        const maxRating = Math.max(...doneEntries.map(r => r.rating));
        const topTasks = doneEntries
          .filter(r => r.rating === maxRating)
          .map(r => r.task);
        const promptBase = `오늘 만족도가 가장 높았던 행동: ${topTasks.join(", ")}`;
        const imageUrl = await generateImageAI(promptBase, completed);
        setDiaryImagesAI(prev => ({ ...prev, [iso]: imageUrl }));
      } else if (count >= 10 && !generated10[day]) {
        setGenerated10(prev => ({ ...prev, [day]: true }));
        const summary = await generateSummaryAI(day, completed);
        setDiarySummariesAI(prev => ({ ...prev, [day]: summary }));
      }
    }
  })();
 }, [routines, todayDiaryLogs, generated5, generated10, currentDate]);

  // ──────────────────────────────────────────────────────────────
  // JSX 리턴 시작 (로그인 분기)
  // ──────────────────────────────────────────────────────────────
return (
<div>
    {/* 1. 토스트(Toast) 알림 추가 */}
    {toast && (
      <div className="fixed bottom-8 right-8 bg-black text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 z-50">
        <span>{toast.emoji}</span>
        <span>{toast.message}</span>
      </div>
    )}
    {!isLoggedIn ? (
      <form
        onSubmit={e => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ID"
          required
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="PW"
          required
        />
        <button type="submit">로그인</button>
        {authError && <p style={{ color: "red" }}>{authError}</p>}
      </form>
    ) : (
      <div>
        <div>안녕하세요, {session?.user?.email}님</div>
        {/* 관리자 모드 버튼은 로그인 영역 안에서 조건부로! */}
        {isAdmin && (
          <button className="mb-4 px-4 py-2 bg-red-600 text-white rounded font-semibold">
            관리자 모드
          </button>
        )}
        <button onClick={handleLogout}>로그아웃</button>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setSelectedTab('routine-habit')}
            className={`rounded-full px-5 py-2 font-semibold transition ${
              selectedTab === 'routine-habit'
                ? 'bg-black text-white'
                : 'bg-gray-300 text-black'
            }`}
          >
            루틴 및 습관
          </button>
          <button
            onClick={() => setSelectedTab('tracker')}
            className={`rounded-full px-5 py-2 font-semibold transition ${
              selectedTab === 'tracker'
                ? 'bg-black text-white'
                : 'bg-gray-300 text-black'
            }`}
          >
            통계
          </button>
          <button
            onClick={() => setSelectedTab('today-diary')}
            className={`rounded-full px-5 py-2 font-semibold transition ${
              selectedTab === 'today-diary'
                ? 'bg-black text-white'
                : 'bg-gray-300 text-black'
            }`}
          >
            오늘 일기
          </button>
        </div>
	<div className="flex justify-center gap-2 mt-4">
	  {fullDays.map((day) => (
	    <button
	      key={day}
	      onClick={() => setSelectedDay(day)}
	      className={`rounded-full px-4 py-1 font-semibold ${
	        selectedDay === day ? "bg-black text-white" : "bg-gray-300 text-black"
	      }`}
	      aria-label={day}
	    >
	      {day}
	    </button>
	  ))}
	</div>

        {/* 루틴 및 습관 탭 */}
        {selectedTab === 'routine-habit' && (
          <div>
            <div className="flex flex-col gap-2 mt-4">
              <input
                type="time"
                step={3600}
                value={newRoutine.start}
                onChange={e =>
                  setNewRoutine(prev => ({
                    ...prev,
                    start: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
              <input
                type="time"
                step={3600}
                value={newRoutine.end}
                onChange={e =>
                  setNewRoutine(prev => ({
                    ...prev,
                    end: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
              <input
                type="text"
                placeholder="루틴 또는 습관 추가"
                value={newRoutine.task}
                onChange={e =>
                  setNewRoutine(prev => ({
                    ...prev,
                    task: e.target.value,
                  }))
                }
                className="border rounded px-2 py-1"
              />
              <button
                onClick={handleAddRoutine}
                className="rounded-full bg-black text-white py-2 mt-2 w-full font-semibold hover:bg-gray-800 transition"
              >
                추가
              </button>
            </div>

            {/* 루틴/습관 리스트 */}
            <div className="mt-6 space-y-4">
              {routines
                .filter(r => r.day === selectedDay)
                .map((routine, idx, arr) => {
                  const globalIdx = routines.indexOf(routine);
                  return (
                    <React.Fragment key={`${routine.task}-${idx}`}>
                      <div className="border rounded p-4 flex justify-between items-center">
                        <div>
                          <span className="font-semibold">
                            [{routine.start} - {routine.end}] {routine.task}
                          </span>
                          {routine.done && (
                            <span className="ml-2 text-green-600 font-semibold">
                              ✔
                            </span>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={routine.done}
                          onChange={() => toggleDone(globalIdx)}
                        />
                      </div>
                      {routine.done && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {[...Array(10).keys()].map(n => (
                            <button
                              key={n}
                              className={`px-2 rounded ${
                                routine.rating === n + 1
                                  ? 'bg-black text-white'
                                  : 'bg-gray-300 text-black'
                              }`}
                              onClick={() => setRating(globalIdx, n + 1)}
                            >
                              {n + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {idx < arr.length - 1 && arr.length > 1 && (
                        <>
                          {/* AI 습관 추천 */}
                          {habitSuggestionIdx === globalIdx ? (
                            <div className="p-3 bg-blue-50 rounded space-y-2 relative">
                              <button
                                onClick={() => {
                                  setHabitSuggestionIdx(null);
                                  setAiHabitSuggestions([]);
                                  setAiHabitError(null);
                                }}
                                className="absolute top-1 right-1 px-2 py-0.5 rounded hover:bg-gray-300"
                                aria-label="습관 추천 닫기"
                              >
                                ✕
                              </button>
                              {aiHabitLoading ? (
                                <p>추천 생성 중...</p>
                              ) : aiHabitError ? (
                                <p className="text-red-600">
                                  {aiHabitError}
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {(aiHabitSuggestions.length > 0
                                    ? aiHabitSuggestions
                                    : habitCandidates.slice(0, 3)
                                  ).map((habit, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        addHabitBetween(globalIdx, habit);
                                        setHabitSuggestionIdx(null);
                                        setAiHabitSuggestions([]);
                                        setAiHabitError(null);
                                      }}
                                      className="rounded-full bg-gray-300 px-3 py-1 hover:bg-gray-400"
                                    >
                                      {habit}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center my-2">
                              <button
                                onClick={() =>
                                  handleFetchHabitSuggestions(globalIdx)
                                }
                                className="rounded-full bg-gray-300 px-3 py-1 hover:bg-gray-400"
                                aria-label="습관 추천 열기"
                              >
                                + 습관 추천
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        )}

        {/* 통계 탭 */}
        {selectedTab === 'tracker' && (
          <div className="mt-6">
            <h2 className="text-center font-semibold text-xl mb-4">
              통계
            </h2>
            <WeeklySummary
              routines={routines}
              currentDate={currentDate.toISOString().split('T')[0]}
            />
            <button
              onClick={handleExportCSV}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              모든 로그 CSV 다운로드
            </button>
          </div>
        )}

        {/* 오늘 일기 탭 */}
        {selectedTab === 'today-diary' && (
          <div className="mt-4 space-y-6 max-h-[480px] overflow-y-auto border rounded p-4 bg-gray-50 pb-8">
            <h2 className="text-center font-semibold text-xl mb-4">
              오늘 일기
            </h2>
            {(() => {
              // "계산/분기"만 OK (훅 선언 X)
              const dayIdx = fullDays.indexOf(selectedDay);
              const d = new Date(currentDate);
              d.setDate(
                currentDate.getDate() -
                  currentDate.getDay() +
                  (dayIdx + 1)
              );
              const iso = d.toISOString().split('T')[0];
              const completedTasks = routines
                .filter(r => r.date === iso && r.done)
                .map(r => r.task);
              if (completedTasks.length === 0) return null;
              if (completedTasks.length < 5) return null;
              const diaryDateStr = formatDiaryDate(
                selectedDay,
                currentDate,
                dayIdx
              );
              const summary = diarySummariesAI[iso] || warmSummary(completedTasks);
              const imageUrl = diaryImagesAI[iso];
              return (
                <div key={selectedDay} className="mb-6">
                  <h3 className="font-semibold">{diaryDateStr}</h3>
                  <p className="mb-2 whitespace-pre-line">{summary}</p>
                  {imageUrl && (
                    <div
                      className="mt-2 w-full rounded overflow-hidden relative"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <Image
                        src={imageUrl}
                        alt="오늘의 다이어리 일러스트"
                        fill
                        style={{ objectFit: 'cover' }}
                        priority
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
	</div>
    )}
  </div>
);}
