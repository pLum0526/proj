import { getDatabase, ref, onValue, get } from 'firebase/database';

// 게시글 데이터를 가져오는 함수
export const getPostData = async (userId, postId) => {
  try {
    const db = getDatabase();
    const postRef = ref(db, `posts/${userId}/${postId}`);
    const snapshot = await get(postRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      throw new Error('게시글을 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('게시글 데이터 가져오기 실패:', error);
    throw error;
  }
};

// 특정 유저의 모든 게시글 가져오기
export const getUserPosts = async (userId) => {
  try {
    const db = getDatabase();
    const userPostsRef = ref(db, `posts/${userId}`);
    const snapshot = await get(userPostsRef);

    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, post]) => ({
        id,
        ...post,
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('유저 게시글 데이터 가져오기 실패:', error);
    throw error;
  }
};

// images 객체를 배열로 변환하는 함수
const imagesObjectToArray = (imagesObj) => {
  if (!imagesObj) return [];
  return Object.values(imagesObj);
};

// 게시글 데이터를 변환하는 유틸리티 함수
export const transformPostData = (post) => {
  return {
    ...post,
    image: imagesObjectToArray(post.images),
    // date: post.capturedAt ? post.capturedAt.split('T')[0] : '', // 촬영 시점 (메타데이터)
    date: post.createdAt ? post.createdAt.split('T')[0] : '', // 업로드 한 시점
    date2: post.capturedAt ? post.capturedAt.split('T')[0] : '', // 촬영 시점 (메타데이터)
    lat: post.latitude,
    lng: post.longitude,
    desc: post.description,
    title: post.title,
  };
};

// 모든 게시글 데이터를 실시간으로 구독하는 함수
export const subscribeToPosts = (callback) => {
  const db = getDatabase();
  const postsRef = ref(db, 'posts');
  
  return onValue(postsRef, (snapshot) => {
    const posts = [];
    snapshot.forEach((childSnapshot) => {
      posts.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    callback(posts);
  });
}; 