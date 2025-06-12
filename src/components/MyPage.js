import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserPosts,transformPostData } from "../services/postService";

const MyPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9; // 3x3 그리드이므로 한 페이지에 9개씩

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
        setAllUserPosts([]); // 오류 발생 시 게시물 목록을 비웁니다.
      }finally {
        setLoading(false);
      }
    };
     fetchUserPosts();
  }, [currentUser]); // currentUser가 변경될 때마다 게시물을 다시 불러옵니다.


  // 현재 페이지에 보여줄 게시물 계산
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = allUserPosts.slice(indexOfFirstPost, indexOfLastPost);

  // 페이지 변경 함수
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < Math.ceil(allUserPosts.length / postsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
   if (loading) {
    return <div className="text-center mt-10">게시물을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      {/*메인 내용 */}
      <main>
        <div id="container" className="max-w-3xl mx-auto mt-10 bg-white rounded-lg p-6 shadow-md">
          {/*유저 정보 */}
          <div className="flex justify-between items-center mb-4 border-b border-gray-300 pb-2">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-blue-200 rounded-full flex items-center justify-center overflow-hidden">
                <img src={currentUser?.photoURL || ''} alt="프로필" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="font-bold text-lg">{currentUser?.displayName || '사용자'}</p>
                <button className="text-sm text-gray-500 hover:underline">게시물 {allUserPosts.length}건</button>
              </div>
            </div>
            
          </div>

          {/*썸네일 영역*/}
          {currentPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-4 mt-6">
              {currentPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => navigate(`/detail/${currentUser.uid}/${post.id}`)} 
                  className="w-full aspect-square overflow-hidden rounded-md shadow-md group"
                >
                  <img
                    src={post.images?.img1?.url || "https://via.placeholder.com/300"}
                    alt={post.title || "게시물 썸네일"}
                    className="object-cover w-full h-full transition-transform duration-300 "
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center mt-6 text-gray-500">표시할 게시물이 없습니다.</p>
          )}

          {/* 페이지네이션 컨트롤 */}
          {allUserPosts.length > postsPerPage && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button onClick={prevPage} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                이전
              </button>
              {Array.from({ length: Math.ceil(allUserPosts.length / postsPerPage) }, (_, i) => (
                <button key={i + 1} onClick={() => paginate(i + 1)} className={`px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={nextPage} disabled={currentPage === Math.ceil(allUserPosts.length / postsPerPage)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                다음
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default MyPage;
