// src/components/BoardDate.js
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './CustomCalendar.css'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dummyData } from './dummyData';
import { getUserPosts, transformPostData } from '../services/postService';

const BoardDate = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dateError, setDateError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null); // 선택된 게시글
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [allUserPosts, setAllUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if(!currentUser){
      setLoading(false);
      setAllUserPosts([]);
      return;
    }
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const posts = await getUserPosts(currentUser.uid);
        const transformedPosts = posts.map(transformPostData);
        setAllUserPosts(transformedPosts);
      } catch (err) {
        console.error("사용자 게시물 로딩 실패:", err);
        setError("게시물을 불러오는 데 실패했습니다.");
        setAllUserPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, [currentUser]);

  useEffect(() => {
    // 날짜 값이 비어있거나(0) 잘못된 경우도 체크
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setDateError('날짜를 올바르게 입력하세요.');
    } else if (startDate > endDate) {
      setDateError('시작 날짜는 종료 날짜보다 이전이어야 합니다.');
    } else {
      setDateError('');
    }
  }, [startDate, endDate]);

  // const filteredData = dummyData.filter(item => {
  //   const itemDate = new Date(item.date);
  //   return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
  // }); // LEGACYCODE

  const filteredData = allUserPosts.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className="bg-gray-200 min-h-screen">
      <main className="flex justify-center gap-10 mt-10 px-10">
        {/* 왼쪽: 게시글 목록 */}
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-[320px] flex flex-col">
          <h3 className="font-semibold mb-4 text-center">게시글 목록</h3>
          {dateError ? (
            <div className="text-red-500 text-center mb-2">{dateError}</div>
          ) : filteredData.length === 0 ? (
            <div className="text-gray-500 text-center mb-2">해당 기간의 게시물이 없습니다.</div>
          ) : (
            <ul>
              {filteredData.map(item => (
                <li
                  key={item.id}
                  className={`cursor-pointer p-2 rounded mb-1 hover:bg-blue-100 ${selectedPost && selectedPost.id === item.id ? 'bg-blue-200' : ''}`}
                  onClick={() => {setSelectedPost(item); console.log(item);}}
                >
                  <span className="font-bold">{item.title}</span>
                  <span className="ml-2 text-gray-500 text-sm">{item.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 가운데: 캘린더 및 날짜 구간 선택 */}
        <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-[400px] flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-center">📅 날짜 구간 선택</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="date"
              value={
                !startDate || isNaN(startDate.getTime())
                  ? ''
                  : startDate.toISOString().slice(0, 10)
              }
              onChange={e => {
                const value = e.target.value;
                setStartDate(value ? new Date(value) : new Date('Invalid'));
              }}
              className="border rounded px-2 py-1"
            />
            <span className="mx-2">~</span>
            <input
              type="date"
              value={
                !endDate || isNaN(endDate.getTime())
                  ? ''
                  : endDate.toISOString().slice(0, 10)
              }
              onChange={e => {
                const value = e.target.value;
                setEndDate(value ? new Date(value) : new Date('Invalid'));
              }}
              className="border rounded px-2 py-1"
            />
          </div>
          {/* 날짜 오류 메시지 캘린더 아래에도 출력 */}
          {dateError && (
            <div className="text-red-500 text-center mb-2">{dateError}</div>
          )}
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
          />
        </div>

        {/* 오른쪽: 선택된 게시글 + 유저 정보 + 글쓰기 버튼 */}
        <div className="flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            {/* 유저 정보 */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center overflow-hidden">
                <img src={currentUser?.photoURL || ''} alt="프로필" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="font-bold text-lg">{currentUser?.displayName || '사용자'}</p>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline" 
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* 선택된 게시글만 표시 */}
            {!selectedPost ? (
              <div className="text-gray-500 text-center">왼쪽 목록에서 게시글을 선택하세요.</div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-4 w-80 mb-4">
                <img src={selectedPost.image[0].url} alt="사진" className="w-full h-48 object-cover rounded-md mb-3" />
                <div className="flex justify-between items-center mb-1">
                  <span className="text-red-500 text-xl">❤</span>
                  <h3 className="text-lg font-semibold">{selectedPost.title}</h3>
                </div>
                <p className="text-sm text-gray-700 mb-2">{selectedPost.desc}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>📍</span>
                  <span>{selectedPost.date}</span>
                </div>
                <button
                  className="mt-2 text-blue-500 hover:underline"
                  onClick={() => navigate(`/detail/${currentUser.uid}/${selectedPost.id}`)}
                >
                  상세보기
                </button>
              </div>
            )}
          </div>

          {/* 글쓰기 버튼: 오른쪽 하단에 고정 */}
          <div className="mt-4 self-end">
            <button
              className="w-80 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => navigate('/upload')}
            >
              글쓰기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BoardDate;