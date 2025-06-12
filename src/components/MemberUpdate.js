import React from "react";
import { useAuth } from "../contexts/AuthContext";

const MemberUpdate = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-gray-200 min-h-screen">
      {/* 메인 영역 */}
      <main className="max-w-3xl mx-auto mt-10 bg-white rounded-lg p-8 shadow-md space-y-6">
        <form action="index.html">
          {/* 프로필 영역 */}
          <div className="flex items-center justify-between border border-gray-400 rounded-xl p-6 bg-gray-100">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-blue-200 rounded-full overflow-hidden">
                <img src={currentUser?.photoURL || ''} alt="프로필" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{currentUser?.displayName || '사용자'}</p>
              </div>
            </div>
            <button className="bg-gray-300 px-4 py-1 rounded-md text-sm hover:bg-gray-400">
              사진 변경
            </button>
          </div>

          {/* 소개 */}
          <div>
            <p className="font-semibold text-lg mb-1">소개</p>
            <input
              type="text"
              placeholder="상태메세지"
              className="w-full p-3 rounded-md border border-gray-300 bg-gray-100"
            />
          </div>

          {/* ID 변경 */}
          <div>
            <p className="font-semibold text-lg mb-1">ID 변경</p>
            <input
              type="text"
              placeholder="USER_ID"
              className="w-full p-3 rounded-md border border-gray-300 bg-gray-100"
            />
          </div>

          {/* PW 변경 */}
          <div>
            <p className="font-semibold text-lg mb-1">PW 변경</p>
            <input
              type="password"
              placeholder="현재 비밀번호"
              className="w-full p-3 rounded-md border border-gray-300 bg-gray-100 mb-2"
            />
            <input
              type="password"
              placeholder="변경할 비밀번호"
              className="w-full p-3 rounded-md border border-gray-300 bg-gray-100"
            />
          </div>

          <input
            type="submit"
            value="확인"
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded-md transition duration-200 cursor-pointer mt-4"
          />
        </form>
      </main>
    </div>
  );
};

export default MemberUpdate;