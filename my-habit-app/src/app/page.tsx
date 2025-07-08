'use client';
import Image from "next/image"; 
import WeeklySummary from "@/components/ui/WeeklySummary";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

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
      {!isLoggedIn ? (
      <div className="auth-form max-w-sm mx-auto p-6 mt-20 border rounded space-y-4">
        <button
          onClick={handleLocalLogin}
          className="w-full py-2 bg-black text-white rounded"
        >
          로그인
        </button>
        <button
          onClick={handleAddUser}
          className="w-full py-2 bg-gray-300 rounded"
        >
          사용자 등록
        </button>
        {loginError && (
          <p className="text-red-600 text-sm">{loginError}</p>
        )}
      </div>
    ) : (
      <>
        <div className="flex justify-end gap-2">
          <span className="text-sm text-gray-600">
            안녕하세요, {session.user.email}님
          </span>
          <button
            onClick={() => signOut({ redirect: false })}
            className="text-red-600 underline text-sm"
          >
            로그아웃
          </button>
        </div>

        {/* 관리자 모드 버튼 */}
        {/* {isAdmin && <button>관리자 모드</button>} */}

        {/* 탭 네비게이션 */}
        <div className="flex justify-center gap-4 mt-4">
          {/* … your three tab buttons here … */}
        </div>

        {/* 각 탭 컨텐츠 */}
        {/* {selectedTab === 'routine-habit' && <RoutineTab />} */}
        {/* {selectedTab === 'tracker'       && <TrackerTab />} */}
        {/* {selectedTab === 'today-diary'   && <TodayDiaryTab />} */}
      </>
    )}
  </div>
);

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
              .map((routine, idx) => {
                    // 전체 routines 배열에서 이 routine의 실제 인덱스
                    const globalIdx = routines.indexOf(routine);
                    // 중괄호 블록 안에서는 JSX를 return 해줘야 합니다
                    return (
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
                          onChange={() => toggleDone(globalIdx)}
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
                              onClick={() => setRating(globalIdx, n + 1)}
                            >
                              {n + 1}
                            </button>
                          ))}
                        </div>
                      )}
                      {idx < arr.length - 1 && arr.length > 1 && (
                        <>
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
                                <p className="text-red-600">{aiHabitError}</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {(aiHabitSuggestions.length > 0 ? aiHabitSuggestions : habitCandidates.slice(0, 3)).map((habit, i) => (
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
                                onClick={() => handleFetchHabitSuggestions(globalIdx)}
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
                 )
               })}
              </div>
            </div>
          )}
          
        {selectedTab === "tracker" && (
        <div className="mt-6">
          <h2 className="text-center font-semibold text-xl mb-4">통계</h2>
          <WeeklySummary
            routines={routines}
            currentDate={currentDate.toISOString().split("T")[0]}
          />
          {/* 여기에 버튼 추가 */}
          <button
            onClick={handleExportCSV}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            모든 로그 CSV 다운로드
          </button>
        </div>
      )}
          
          {selectedTab === "today-diary" && (
            <div className="mt-4 space-y-6 max-h-[480px] overflow-y-auto border rounded p-4 bg-gray-50 pb-8">
              <h2 className="text-center font-semibold text-xl mb-4">오늘 일기</h2>
               {/* selectedDay만 렌더 */}
               {(() => {
                 // selectedDay → 실제 ISO 날짜 계산
                 const dayIdx = fullDays.indexOf(selectedDay);     // 0=월...6=일
                 const d = new Date(currentDate);
                 d.setDate(currentDate.getDate() - currentDate.getDay() + (dayIdx + 1));
                 const iso = d.toISOString().split("T")[0];
              
                 // routines 에서 해당 날짜에 done === true 인 task 목록 추출
                 const completedTasks = routines
                   .filter(r => r.date === iso && r.done)
                   .map(r => r.task);
                 // 행동이 하나도 없으면 일기 미표시
                 if (completedTasks.length === 0) return null;
                 if (completedTasks.length < 5) return null;
                 const idx = fullDays.indexOf(selectedDay);
                 const diaryDateStr = formatDiaryDate(selectedDay, currentDate, idx);
                 const summary = diarySummariesAI[iso] || warmSummary(completedTasks);
                 const imageUrl = diaryImagesAI[iso];
                 return (
                   <div key={selectedDay} className="mb-6">
                     <h3 className="font-semibold">{diaryDateStr}</h3>
                     <p className="mb-2 whitespace-pre-line">{summary}</p>
                     {/* … 이미지 표시 … */}
                      {imageUrl && (
                        <div className="mt-2 w-full rounded overflow-hidden relative" style={{ aspectRatio: "4/3" }}>
                          <Image
                            src={imageUrl}
                            alt="오늘의 다이어리 일러스트"
                            fill                             // 부모 <div> 를 꽉 채우도록
                            style={{ objectFit: "cover" }}  // 이미지 비율 유지하며 잘라내기
                            priority                         // LCP 최적화 (선택)
                          />
                    </div>
                  )}
                </div>
                 );
               })()}

            </div>
          )}
        </>
      )}
    </div>
  );
}
