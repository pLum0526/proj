import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  extractImageMetadata, 
  requestLocationPermission, 
  getCurrentLocation,
} from '../utils/imageUtils';
import { getDatabase, ref, push, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const UploadForm = () => {
  const { currentUser } = useAuth();
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const userUid = currentUser.uid;

  const db = getDatabase();
  const postsRef = ref(db, `posts/${userUid}`);
  const newPostRef = push(postsRef);
  const postId = newPostRef.key;

  const storage = getStorage();
  const imageUrls = [];

  // 날짜 형식 변환 함수
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // YY/MM/DD 형식으로 변환하는 함수 추가
  const formatDateYYMMDD = (date) => {
    const year = String(date.getFullYear()).slice(-2); // 연도의 마지막 2자리
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date();
    setSelectedDate(formatDate(today));
  }, []);

  const handleImageChange = async (e) => {
    try {
      setError(null);
      const files = Array.from(e.target.files).slice(0, 10);
      console.log('선택된 파일들:', files.map(f => f.name));
      
      // 위치 권한 확인
      const hasLocationPermission = await requestLocationPermission();
      console.log('위치 권한 상태:', hasLocationPermission);
      
      // 첫 번째 이미지의 메타데이터 추출
      if (files.length > 0) {
        const firstImageMetadata = await extractImageMetadata(files[0]);
        console.log('첫 번째 이미지 메타데이터:', firstImageMetadata);
        
        // 날짜 정보가 있는 경우 날짜 입력 필드 업데이트
        if (firstImageMetadata?.date) {
          const imageDate = new Date(firstImageMetadata.date);
          setSelectedDate(formatDate(imageDate));
        }
        
        // 위치 정보가 없고 권한이 있는 경우 현재 위치 사용
        if (!firstImageMetadata?.location && hasLocationPermission) {
          try {
            const currentLocation = await getCurrentLocation();
            console.log('현재 위치 사용:', currentLocation);
            setSelectedLocation(currentLocation);
          } catch (error) {
            console.error('현재 위치 가져오기 실패:', error);
          }
        } else if (firstImageMetadata?.location) {
          setSelectedLocation(firstImageMetadata.location);
        }
      }
      
      // 모든 이미지 처리
      const processedImages = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setSelectedImages(prevImages => [...prevImages, ...processedImages]);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      setError('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleImageDelete = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
    
    // 마지막 이미지가 삭제된 경우
    if (newImages.length === 0) {
      // 날짜를 당일로 설정
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
      setSelectedLocation(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImages.length) {
      setError('이미지를 선택해주세요.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // postId 생성
      const db = getDatabase();
      const postsRef = ref(db, `posts/${userUid}`);
      const newPostRef = push(postsRef);
      const postId = newPostRef.key;

      // 첫 번째 이미지의 메타데이터 추출
      let firstImageMetadata = null;
      if (selectedImages.length > 0) {
        console.log('\n첫 번째 이미지 메타데이터 추출 시작');
        firstImageMetadata = await extractImageMetadata(selectedImages[0].file);
        console.log('첫 번째 이미지 메타데이터:', firstImageMetadata);
        
        // 위치 정보가 없고 권한이 있는 경우 현재 위치 사용
        const hasLocationPermission = await requestLocationPermission();
        if (!firstImageMetadata?.location && hasLocationPermission) {
          try {
            const currentLocation = await getCurrentLocation();
            console.log('현재 위치 사용:', currentLocation);
            firstImageMetadata.location = currentLocation;
          } catch (error) {
            console.error('현재 위치 가져오기 실패:', error);
          }
        }
      }

      // 위치 정보 확인
      if (!selectedLocation && !firstImageMetadata?.location) {
        setError('위치 정보가 필요합니다. 지도에서 위치를 선택해주세요.');
        setIsUploading(false);
        return;
      }

      // 이미지 Storage에 업로드 및 downloadURL 획득
      const storage = getStorage();
      const imageUrls = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        const imageId = `img${i + 1}`;
        const ext = image.file.name.split('.').pop();
        const filePath = `images/${userUid}/${postId}/${imageId}.${ext}`;
        const fileRef = storageRef(storage, filePath);

        // 이미지 업로드
        await uploadBytes(fileRef, image.file);

        // 다운로드 URL 획득
        const url = await getDownloadURL(fileRef);

        imageUrls.push({
          url,
          isThumbnail: i === 0, // 첫 번째 이미지를 썸네일로 지정
        });
      }

      // 포스트 데이터 Realtime Database에 저장
      const postData = {
        latitude: selectedLocation?.lat || firstImageMetadata?.location?.lat,
        longitude: selectedLocation?.lng || firstImageMetadata?.location?.lng,
        title: title,
        description: description,
        createdAt: new Date().toISOString(),
        capturedAt: formatDateYYMMDD(new Date(selectedDate)),
        images: imageUrls.reduce((acc, img, idx) => {
          acc[`img${idx + 1}`] = img;
          return acc;
        }, {})
      };

      await set(newPostRef, postData);

      navigate('/board_map');
    } catch (error) {
      console.error('업로드 실패:', error);
      setError('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const initMap = () => {
      const center = { lat: 36.5, lng: 127.8 }; // 대한민국 중심 좌표
      const mapInstance = new window.google.maps.Map(document.getElementById("upload-map"), {
        zoom: 7,
        center: center,
        disableDefaultUI: true,
      });

      mapInstance.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelectedLocation({ lat, lng });
        
        // 기존 마커 제거
        if (window.marker) {
          window.marker.setMap(null);
        }
        
        // 새로운 마커 생성
        window.marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
        });
      });

      setMap(mapInstance);
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    window.initMap = initMap;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete window.initMap;
    };
  }, []);

  useEffect(() => {
    if (!map || !selectedLocation) return;

    // 기존 마커 제거
    if (window.marker) {
      window.marker.setMap(null);
    }

    // 새로운 마커 생성
    window.marker = new window.google.maps.Marker({
      position: selectedLocation,
      map: map,
    });

    // 지도 중심 이동
    map.setCenter(selectedLocation);
  }, [map, selectedLocation]);

  return (
    <main className="flex justify-center gap-16 mt-10 px-10">
      {/* 지도 영역 */}
      <div id="upload-map" className="w-[600px] h-[600px] rounded-lg shadow-lg bg-gray-300">
        {/* Google Maps API로 지도 삽입될 자리 */}
      </div>

      {/* 사진 등록 폼 */}
      <form onSubmit={handleSubmit} className="w-96 bg-white p-6 rounded-lg shadow-lg space-y-6">
        {/* 제목 입력란 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        {/* 이미지 업로드 */}
        <div className="space-y-4">
          <label className="block w-full border-2 border-dashed border-gray-400 rounded-md flex flex-col items-center justify-center cursor-pointer">
            {selectedImages.length > 0 ? (
              <div className="w-full p-4">
                <div className="grid grid-cols-2 gap-3">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative aspect-square">
                      <img 
                        src={image.preview} 
                        alt={`선택된 이미지 ${index + 1}`} 
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); // 이벤트 전파 방지
                          handleImageDelete(index);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedImages.length < 10 && (
                  <div className="mt-3 text-center">
                    <span className="text-gray-500 text-sm">
                      {selectedImages.length}/10 장의 이미지가 선택되었습니다.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 flex flex-col items-center justify-center">
                <span className="text-4xl mb-2">+</span>
                <span className="text-gray-500 text-sm text-center">
                  여기를 눌러 사진을 등록하세요<br/>
                  <span className="text-xs">(최대 10장)</span>
                </span>
              </div>
            )}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </label>
        </div>

        {/* 위치 정보 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">날짜</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 shadow-sm" 
          />
        </div>

        {/* 사진 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">사진 설명</label>
          <textarea 
            placeholder="사진 설명을 입력하세요." 
            rows="3" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* 등록 버튼 */}
        <button 
          type="submit" 
          disabled={isUploading}
          className={`w-full py-2 rounded-md ${
            isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isUploading ? '업로드 중...' : '등록'}
        </button>
      </form>
    </main>
  );
};

export default UploadForm;