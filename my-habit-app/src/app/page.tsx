'use client';

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image"; 
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DiarySection from "@/components/DiarySection";


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
const dayLetters = fullDays.map((d) => d[0]);

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

function Toast({ message, emoji, onClose }: { message: string; emoji: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 bg-black text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 z-50">
      <span>{emoji}</span>
      <span>{message}</span>
    </div>
  );
}

function formatWeekLabel(date: Date, weekNum: number) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}.W${weekNum}`;
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

function formatMonthDay(date: Date, dayIndex: number) {
  const firstDayOfWeek = new Date(date);
  firstDayOfWeek.setDate(date.getDate() - date.getDay() + dayIndex + 1);
  const mm = String(firstDayOfWeek.getMonth() + 1).padStart(2, "0");
  const dd = String(firstDayOfWeek.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

export default function Page() {
  const [userId, setUserId] = useState("");
  const [userPw, setUserPw] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{ message: string; emoji: string } | null>(null);
  const [loginError, setLoginError] = useState("");
  const [adminModeActive, setAdminModeActive] = useState(false);

  const adminId = "3333";
  const adminPw = "8888";
  const storedUsersKey = "registeredUsers";
  const routinesKey = `routines_${userId}`;
  const diaryLogsKey = `todayDiaryLogs_${userId}`;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekNum, setWeekNum] = useState(1);
  const [selectedDay, setSelectedDay] = useState(fullDays[0]);
  const [selectedTab, setSelectedTab] = useState<"routine-habit" | "tracker" | "today-diary">("routine-habit");

  const [routines, setRoutines] = useState<Routine[]>(() => {
    if (typeof window === "undefined" || !userId) return [];
    const saved = localStorage.getItem(routinesKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [newRoutine, setNewRoutine] = useState({ start: "08:00", end: "09:00", task: "" });
  const [habitSuggestionIdx, setHabitSuggestionIdx] = useState<number | null>(null);
  const [todayDiaryLogs, setTodayDiaryLogs] = useState<Record<string, string[]>>(() => {
    if (typeof window === "undefined" || !userId) return {};
    const saved = localStorage.getItem(diaryLogsKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [diarySummariesAI, setDiarySummariesAI] = useState<Record<string, string>>({});
  const [diaryImagesAI, setDiaryImagesAI] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});

  const [aiHabitSuggestions, setAiHabitSuggestions] = useState<string[]>([]);
  const [aiHabitLoading, setAiHabitLoading] = useState(false);
  const [aiHabitError, setAiHabitError] = useState<string | null>(null);

  const getRegisteredUsers = (): { id: string; pw: string }[] => {
    if (typeof window === "undefined") return [];
    const json = localStorage.getItem(storedUsersKey);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  };
  const saveRegisteredUsers = (users: { id: string; pw: string }[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(storedUsersKey, JSON.stringify(users));
  };

  const [newUserId, setNewUserId] = useState("");
  const [newUserPw, setNewUserPw] = useState("");
  const [userAddError, setUserAddError] = useState("");

  const handleLogin = () => {
    if (!userId.trim() || !userPw.trim()) {
      setLoginError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    if (adminModeActive) {
      if (userId === adminId && userPw === adminPw) {
        setIsLoggedIn(true);
        setIsAdmin(true);
        setLoginError("");
        setToast({ emoji: "✅", message: "관리자 로그인 성공!" });
      } else {
        setLoginError("관리자 계정이 아닙니다.");
        setToast({ emoji: "⚠️", message: "관리자 로그인 실패" });
      }
      return;
    }
    const users = getRegisteredUsers();
    const found = users.find((u) => u.id === userId && u.pw === userPw);
    if (found) {
      setIsLoggedIn(true);
      setIsAdmin(false);
      setLoginError("");
      setToast({ emoji: "✅", message: "로그인 성공!" });
    } else {
      setLoginError("등록된 사용자 ID 또는 비밀번호가 올바르지 않습니다.");
      setToast({ emoji: "⚠️", message: "로그인 실패" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId("");
    setUserPw("");
    setIsAdmin(false);
    setAdminModeActive(false);
    setToast({ emoji: "👋", message: "로그아웃 되었습니다." });
  };

  const handleAddUser = () => {
    if (!newUserId.trim() || !newUserPw.trim()) {
      setUserAddError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }
    const users = getRegisteredUsers();
    if (users.find((u) => u.id === newUserId)) {
      setUserAddError("이미 존재하는 아이디입니다.");
      return;
    }
    const updated = [...users, { id: newUserId, pw: newUserPw }];
    saveRegisteredUsers(updated);
    setUserAddError("");
    setNewUserId("");
    setNewUserPw("");
    setToast({ emoji: "✅", message: `사용자 ${newUserId} 등록 완료!` });
  };

  useEffect(() => {
    if (userId) {
      localStorage.setItem(routinesKey, JSON.stringify(routines));
    }
  }, [routines, routinesKey, userId]);
  useEffect(() => {
    if (userId) {
      localStorage.setItem(diaryLogsKey, JSON.stringify(todayDiaryLogs));
    }
  }, [todayDiaryLogs, diaryLogsKey, userId]);

  // ── 주간 완료율 데이터

  
  // 전체 로그를 CSV로 내보내는 새로운 downloadCSV
  function downloadCSV(data: Routine[]) {
    if (data.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

  // 헤더 정의
  const headers = [
    "Date",
    "Day",
    "Start",
    "End",
    "Task",
    "Done",
    "Rating",
    "IsHabit",
  ];

  // 모든 routines 항목을 한 줄씩 매핑
  const rows = data.map(({ date, day, start, end, task, done, rating, isHabit }) => [
    date, 
    day,
    start,
    end,
    `"${task.replace(/"/g, '""')}"`,
    done ? "Yes" : "No",
    rating.toString(),
    isHabit ? "Yes" : "No",
  ]);

  // CSV 문자열 생성
  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  // 다운로드 처리
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "all_habit_logs.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


  const addHabitBetween = (idx: number, habit: string) => {
    if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
  // ① 선택된 요일의 실제 날짜 계산 (YYYY-MM-DD)
  const today = new Date(currentDate);
  const dayIdx = fullDays.indexOf(selectedDay);       // 월=0 … 일=6
  const realDate = new Date(today);
  realDate.setDate(today.getDate() - today.getDay() + (dayIdx + 1));
  const isoDate = realDate.toISOString().split("T")[0];

  // ② date 필드를 포함한 habitRoutine 생성
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
    const copy = [...routines];
    copy.splice(idx + 1, 0, habitRoutine);
    setRoutines(copy);
    setHabitSuggestionIdx(null);
  };

  const handlePrevWeek = () => {
    setWeekNum((w) => Math.max(1, w - 1));
    setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
  };
  const handleNextWeek = () => {
    setWeekNum((w) => w + 1);
    setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
  };


  // ✏️ handleAddRoutine 함수 정의 (맨 위쪽 함수 목록 안에 넣어주세요)
  const handleAddRoutine = () => {
    if (!isLoggedIn) {
      alert("로그인 후 이용해주세요.");
      return;
    }
    if (!newRoutine.task.trim()) return;

    // 1) 오늘 날짜 중 선택된 요일 실제 날짜 계산
    const today = new Date(currentDate);
    const dayIdx = fullDays.indexOf(selectedDay); // 0=월...6=일
    const realDate = new Date(today);
    realDate.setDate(today.getDate() - today.getDay() + (dayIdx + 1));
    const isoDate = realDate.toISOString().split("T")[0];

    // 2) routines에 date 필드 포함해서 추가
    setRoutines(prev => [
      ...prev,
      {
        date: isoDate,
        day: selectedDay,
        start: newRoutine.start,
        end: newRoutine.end,
        task: newRoutine.task,
        done: false,
        rating: 0,
        isHabit: false,
      },
    ]);

    // 3) 입력 필드 초기화
    setNewRoutine({ start: "08:00", end: "09:00", task: "" });
  };

  const toggleDone = (idx: number) => {
    if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
    const copy = [...routines];
    copy[idx].done = !copy[idx].done;
    setRoutines(copy);

    if (!copy[idx].done) return;

    const { emoji, msg } = getEncouragementAndHabit(copy[idx].task);
    setToast({ emoji, message: `${msg} "${copy[idx].task}"!` });
    setHabitSuggestionIdx(idx);

    setTodayDiaryLogs((prev) => {
      const dayLogs = prev[copy[idx].day] || [];
      if (!dayLogs.includes(copy[idx].task)) {
        return {
          ...prev,
          [copy[idx].day]: [...dayLogs, copy[idx].task],
        };
      }
      return prev;
    });
  };

  const setRating = (idx: number, rating: number) => {
    if (!isLoggedIn) return alert("로그인 후 이용해주세요.");
    const copy = [...routines];
    copy[idx].rating = rating;
    setRoutines(copy);
  };

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
useEffect(() => {
  (async () => {
    for (const day of fullDays) {
      if (diarySummariesAI[day] && !diaryImagesAI[day] && !loadingAI[day]) {
        setLoadingAI(prev => ({ ...prev, [day]: true }));

        // ★ topTasks 계산
        const doneEntries = routines.filter(r => r.day === day && r.done);
        const maxRating = doneEntries.length
          ? Math.max(...doneEntries.map(r => r.rating))
          : 0;
        const topTasks = doneEntries
          .filter(r => r.rating === maxRating)
          .map(r => r.task);
        const promptBase = `오늘 만족도가 가장 높았던 행동: ${topTasks.join(", ")}`;

        const generated = await generateImageAI(promptBase);
        if (generated) {
          setDiaryImagesAI(prev => ({ ...prev, [day]: generated }));
        }
        setLoadingAI(prev => ({ ...prev, [day]: false }));
      }
    }
  })();
}, [diarySummariesAI, diaryImagesAI, loadingAI, routines]);


useEffect(() => {
  if (selectedTab === "today-diary") {
    generateDiaryAI();
  }
}, [selectedTab, todayDiaryLogs, routines, generateDiaryAI]);

return (
    <div className="max-w-xl mx-auto p-6 space-y-6 font-sans relative min-h-screen pb-8">
      {toast && <Toast emoji={toast.emoji} message={toast.message} onClose={() => setToast(null)} />}

      {!isLoggedIn ? (
        <div className="max-w-sm mx-auto p-6 mt-20 border rounded shadow space-y-4 font-sans">
          <h2 className="text-xl font-semibold text-center">로그인 해주세요</h2>
          <input
            type="text"
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={userPw}
            onChange={(e) => setUserPw(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />

          <div className="flex justify-between items-center mt-1">
            <button
              onClick={() => {
                setAdminModeActive(!adminModeActive);
                setLoginError("");
                setUserId("");
                setUserPw("");
                setUserAddError("");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {adminModeActive ? "일반 로그인 모드로 전환" : "관리자 모드"}
            </button>
            <button
              onClick={handleLogin}
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              로그인
            </button>
          </div>

          {loginError && <p className="text-red-600">{loginError}</p>}

          {adminModeActive && (
            <div className="mt-4 border rounded p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">사용자 등록 (관리자 전용)</h3>
              <input
                type="text"
                placeholder="새 사용자 아이디"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                className="border rounded px-3 py-2 w-full mb-2"
              />
              <input
                type="password"
                placeholder="새 사용자 비밀번호"
                value={newUserPw}
                onChange={(e) => setNewUserPw(e.target.value)}
                className="border rounded px-3 py-2 w-full mb-2"
              />
              {userAddError && <p className="text-red-600 mb-2">{userAddError}</p>}
              <button
                onClick={handleAddUser}
                className="bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 transition"
              >
                사용자 등록
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-end gap-2">
            <span className="text-sm text-gray-600">안녕하세요, {userId}님</span>
            <button
              onClick={handleLogout}
              className="text-red-600 underline text-sm hover:text-red-800 transition"
            >
              로그아웃
            </button>
          </div>

          {isAdmin && (
            <button className="mb-4 px-4 py-2 bg-red-600 text-white rounded font-semibold">
              관리자 모드
            </button>
          )}

          <div className="flex justify-center items-center gap-4">
            <button aria-label="Previous Week" onClick={handlePrevWeek} className="px-3 py-1 text-lg font-bold">
              &lt;
            </button>
            <span className="font-semibold text-lg">{formatWeekLabel(currentDate, weekNum)}</span>
            <button aria-label="Next Week" onClick={handleNextWeek} className="px-3 py-1 text-lg font-bold">
              &gt;
            </button>
          </div>

          <div className="flex justify-center gap-3 mt-2">
            {dayLetters.map((letter, idx) => (
              <div key={letter + idx} className="flex flex-col items-center">
                <span className="text-xs text-gray-500">{formatMonthDay(currentDate, idx)}</span>
                <button
                  onClick={() => setSelectedDay(fullDays[idx])}
                  className={`rounded-full w-8 h-8 flex items-center justify-center font-semibold ${
                    selectedDay === fullDays[idx] ? "bg-black text-white" : "bg-gray-300 text-black"
                  }`}
                  aria-label={fullDays[idx]}
                >
                  {letter}
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setSelectedTab("routine-habit")}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                selectedTab === "routine-habit" ? "bg-black text-white" : "bg-gray-300 text-black"
              }`}
            >
              루틴 및 습관
            </button>
            <button
              onClick={() => setSelectedTab("tracker")}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                selectedTab === "tracker" ? "bg-black text-white" : "bg-gray-300 text-black"
              }`}
            >
              통계
            </button>
            <button
              onClick={() => setSelectedTab("today-diary")}
              className={`rounded-full px-5 py-2 font-semibold transition ${
                selectedTab === "today-diary" ? "bg-black text-white" : "bg-gray-300 text-black"
              }`}
            >
              오늘 일기
            </button>
          </div>

          {selectedTab === "routine-habit" && (
            <div>
              <div className="flex flex-col gap-2 mt-4">
                <input
                  type="time"
                  step={3600}
                  value={newRoutine.start}
                  onChange={(e) => setNewRoutine((prev) => ({ ...prev, start: e.target.value }))}
                  className="border rounded px-2 py-1"
                />
                <input
                  type="time"
                  step={3600}
                  value={newRoutine.end}
                  onChange={(e) => setNewRoutine((prev) => ({ ...prev, end: e.target.value }))}
                  className="border rounded px-2 py-1"
                />
                <input
                  type="text"
                  placeholder="루틴 또는 습관 추가"
                  value={newRoutine.task}
                  onChange={(e) => setNewRoutine((prev) => ({ ...prev, task: e.target.value }))}
                  className="border rounded px-2 py-1"
                />
                <button
                  onClick={handleAddRoutine}  // handleAddRoutine 연결
                  className="rounded-full bg-black text-white py-2 mt-2 w-full font-semibold hover:bg-gray-800 transition"
                >
                  추가
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {routines
                  .filter((r) => r.day === selectedDay)
                  .map((routine, idx, arr) => (
                    <React.Fragment key={`${routine.task}-${idx}`}>
                      <div
                        className="border rounded p-4 flex justify-between items-center"
                        title=""
                      >
                        <div>
                          <span className="font-semibold">
                            [{routine.start} - {routine.end}] {routine.task}
                          </span>
                          {routine.done && <span className="ml-2 text-green-600 font-semibold">✔</span>}
                        </div>
                        <input
                          type="checkbox"
                          checked={routine.done}
                          onChange={() => {
                            toggleDone(routines.indexOf(routine));
                          }}
                        />
                      </div>
                      {routine.done && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {[...Array(10).keys()].map((n) => (
                            <button
                              key={n}
                              className={`px-2 rounded ${
                                routine.rating === n + 1 ? "bg-black text-white" : "bg-gray-300 text-black"
                              }`}
                              onClick={() => setRating(routines.indexOf(routine), n + 1)}
                            >
                              {n + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {idx < arr.length - 1 && arr.length > 1 && (
                        <>
                          {habitSuggestionIdx === idx ? (
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
                                <p className="text-red-600">{aiHabitError}</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {(aiHabitSuggestions.length > 0 ? aiHabitSuggestions : habitCandidates.slice(0, 3)).map((habit, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        addHabitBetween(idx, habit);
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
                                onClick={() => handleFetchHabitSuggestions(idx)}
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
                  ))}
              </div>
            </div>
          )}

{selectedTab === "tracker" && (
  <div className="mt-4 space-y-6">
    <h2 className="font-semibold text-center">습관 통계 — {selectedDay}</h2>

    {/* ── 주간 통계 ── */}
    <div>
      <h3 className="mb-2 font-semibold text-sm">이번 주 ({selectedDay})</h3>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={[{
            name: selectedDay,
            Completion: (() => {
              const done = routines.filter(r => r.day === selectedDay && r.done).length;
              const total = routines.filter(r => r.day === selectedDay).length;
              return total ? Math.round(done / total * 100) : 0;
            })(),
            Satisfaction: (() => {
              const doneArr = routines.filter(r => r.day === selectedDay && r.done);
              return doneArr.length
                ? Math.round(doneArr.reduce((s, r) => s + r.rating, 0) / doneArr.length)
                : 0;
            })()
          }]}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Completion" fill="#0f172a" />
          <Bar dataKey="Satisfaction" fill="#1e40af" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* ── 월간 통계 ── */}
    <div>
      <h3 className="mb-2 font-semibold text-sm">이번 달 ({selectedDay})</h3>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart
          data={(() => {
            const today = new Date(currentDate);
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const arr: { name: string; Completion: number; Satisfaction: number }[] = [];
    
            for (let d = 1; d <= daysInMonth; d++) {
              const dt = new Date(year, month, d);
              // JavaScript에서 getDay(): 일=0, 월=1 ... 토=6
              // fullDays 배열은 월=0 인덱스이므로 +1 해줍니다
              if (dt.getDay() === fullDays.indexOf(selectedDay) + 1) {
                const iso = dt.toISOString().split("T")[0];
                const dayRoutines = routines.filter(r => r.date === iso);
                const doneCount = dayRoutines.filter(r => r.done).length;
                const sat = doneCount
                  ? Math.round(dayRoutines.filter(r => r.done).reduce((sum, r) => sum + r.rating, 0) / doneCount)
                  : 0;
    
                arr.push({
                  name: `${d}일`,
                  Completion: dayRoutines.length
                    ? Math.round((doneCount / dayRoutines.length) * 100)
                    : 0,
                  Satisfaction: sat,
                });
              }
            }
    
            return arr;
          })()}
        >
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="Completion" fill="#0f172a" />
          <Bar dataKey="Satisfaction" fill="#1e40af" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    
        {/* ── 전체 로그 CSV 다운로드 버튼 ── */}
        <div className="text-center mt-4">
          <button
            onClick={() => downloadCSV(routines)}
            className="rounded-full bg-black text-white px-6 py-2 font-semibold hover:bg-gray-800 transition"
          >
            전체 로그 CSV 다운로드
          </button>
        </div>
      </div>
    )}


    {selectedTab === "today-diary" && (
    <>
      {/* 1) 요약 부분 (클라이언트 컴포넌트) */}
      <DiarySection
        day={selectedDay}
        tasks={
          (todayDiaryLogs[selectedDay] || []).filter((task) =>
            routines.some(
              (r) => r.day === selectedDay && r.task === task && r.done
            )
          )
        }
      />

      {/* 2) 이미지 부분 (기존 로직 그대로) */}
      {diaryImagesAI[selectedDay] && (
        <div
          className="mt-4 w-full rounded overflow-hidden relative"
          style={{ aspectRatio: "4/3" }}
        >
          <Image
            src={diaryImagesAI[selectedDay]}
            alt="오늘의 다이어리 일러스트"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      )}
    </>
