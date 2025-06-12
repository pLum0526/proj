import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getPostData, transformPostData } from '../services/postService';

const Detail = () => {
  // userId, postId를 파라미터로 받음
  const { userId, id: postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 실제 데이터 가져오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await getPostData(userId, postId);
        setPost(transformPostData(postData));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId && postId) fetchPost();
  }, [userId, postId]);

  // 이미지가 배열이 아닐 경우도 대비
  const images = post?.image || [];
  const [imgIdx, setImgIdx] = useState(0);
  const [showRoadview, setShowRoadview] = useState(false);
  const roadviewRef = useRef(null);

  // 로드뷰 표시
  useEffect(() => {
    if (showRoadview && window.google && roadviewRef.current && post) {
      new window.google.maps.StreetViewPanorama(roadviewRef.current, {
        position: { lat: post.lat, lng: post.lng },
        pov: { heading: 165, pitch: 0 },
        zoom: 1,
      });
    }
  }, [showRoadview, post]);

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!post) return <div className="p-10 text-center">글을 찾을 수 없습니다.</div>;

  // currentUser 예외처리
  const userPhoto = currentUser?.photoURL || '/default-profile.png';
  const userName = currentUser?.displayName || '익명';

  const goToMain = () => {
    navigate('/board_map');
  };

  const prevImg = () => {
    setImgIdx(idx => (idx === 0 ? images.length - 1 : idx - 1));
  };

  const nextImg = () => {
    setImgIdx(idx => (idx === images.length - 1 ? 0 : idx + 1));
  };

  return (
    <div className="bg-gray-200 min-h-screen">
      <main className="max-w-3xl mx-auto mt-10 bg-white rounded-lg p-6 shadow-md">
        {/* 이미지 슬라이드 */}
        <div className="relative w-full h-[400px] mb-6">
          <img
            src={images[imgIdx]?.url}
            alt={`사진${imgIdx + 1}`}
            className="w-full h-[400px] object-cover rounded-md shadow"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={prevImg}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/70 rounded-full px-3 py-1 shadow hover:bg-white"
              >
                ◀
              </button>
              <button
                onClick={nextImg}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/70 rounded-full px-3 py-1 shadow hover:bg-white"
              >
                ▶
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2 h-2 rounded-full ${i === imgIdx ? 'bg-blue-500' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        {/* 유저 + 장소 정보 */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-200 rounded-full overflow-hidden">
              <img src={userPhoto} alt="프로필" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-semibold">{userName}</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{post.title}</p>
            <p className="text-sm text-gray-500">{post.date}</p>
          </div>
        </div>

        <div className="text-gray-800 text-base mb-8">
          <p>{post.desc}</p>
        </div>

        {/* 로드뷰 버튼 및 패널 */}
        <div className="mb-6">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => setShowRoadview(true)}
          >
            로드뷰 보기
          </button>
        </div>
        {showRoadview && (
          <div className="relative mb-6">
            <button
              className="absolute top-2 right-2 bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 text-xs z-10"
              onClick={() => setShowRoadview(false)}
            >
              닫기
            </button>
            <div
              ref={roadviewRef}
              className="w-full h-[300px] bg-gray-100 rounded shadow"
            />
          </div>
        )}

        {/* 돌아가기 버튼 */}
        <div className="flex">
          <button
            onClick={()=>{navigate(-1)}}
            className="text-sm bg-gray-300 w-full py-2 rounded hover:bg-gray-400"
          >
            돌아가기
          </button>
        </div>
      </main>
    </div>
  );
};

export default Detail;
