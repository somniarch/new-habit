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
            <div className="mt-4 space-y-6 max-h-[480px] overflow-y-auto border rounded p-4 bg-gray-50 pb-8">
              <h2 className="text-center font-semibold text-xl mb-4">오늘 일기</h2>
               {/* selectedDay만 렌더 */}
               {(() => {
                 const completedTasks = todayDiaryLogs[selectedDay] || [];
                 if (completedTasks.length < 5) return null;
                 const idx = fullDays.indexOf(selectedDay);
                 const diaryDateStr = formatDiaryDate(selectedDay, currentDate, idx);
                 const summary = diarySummariesAI[selectedDay] || warmSummary(completedTasks);
                 const imageUrl = diaryImagesAI[selectedDay];
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
