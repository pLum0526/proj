import exifr from 'exifr';

/**
 * 도분초 배열을 실수형 도로 변환
 * @param {Array} dms - [도, 분, 초] 형식의 배열
 * @returns {number} 실수형 도
 */
const convertDMSToDecimal = (dms) => {
  if (!Array.isArray(dms) || dms.length !== 3) return null;
  const [degrees, minutes, seconds] = dms;
  return degrees + (minutes / 60) + (seconds / 3600);
};

/**
 * 이미지 파일에서 EXIF 메타데이터 추출
 * @param {File} file - 이미지 파일
 * @returns {Promise<Object>} 메타데이터 정보
 */
export const extractImageMetadata = async (file) => {
  try {
    // 파일 객체 검증
    if (!file) {
      console.error('파일이 전달되지 않았습니다.');
      return null;
    }

    console.log('파일 정보:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      isFile: file instanceof File,
      isBlob: file instanceof Blob
    });

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      console.error('이미지 파일이 아닙니다:', file.type);
      return null;
    }

    // 파일 크기 확인
    if (file.size === 0) {
      console.error('파일 크기가 0입니다.');
      return null;
    }

    // PNG 파일인 경우 경고
    if (file.type === 'image/png') {
      console.log('PNG 파일은 EXIF 메타데이터를 지원하지 않을 수 있습니다.');
    }

    // EXIF 데이터 추출
    const exifData = await exifr.parse(file, {
      pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'DateTime']
    });
    console.log('추출된 EXIF 데이터:', exifData);

    // 날짜 형식 변환 함수
    const formatDate = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };

    // GPS 좌표 변환
    const latitude = convertDMSToDecimal(exifData?.GPSLatitude);
    const longitude = convertDMSToDecimal(exifData?.GPSLongitude);

    // 기본적인 위치와 날짜 정보 반환
    return {
      location: latitude && longitude ? {
        lat: latitude,
        lng: longitude
      } : null,
      date: formatDate(exifData?.DateTimeOriginal || exifData?.DateTime)
    };

  } catch (error) {
    console.error('EXIF 데이터 추출 실패:', {
      error: error.message,
      fileName: file?.name,
      fileType: file?.type,
      stack: error.stack
    });
    return null;
  }
};

/**
 * 위치 권한 요청 및 확인
 * @returns {Promise<boolean>} 권한 상태
 */
export const requestLocationPermission = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    if (permission.state === 'granted') {
      return true;
    } else if (permission.state === 'prompt') {
      // 사용자에게 권한 요청
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('위치 권한 요청 실패:', error);
    return false;
  }
};

/**
 * 현재 위치 가져오기
 * @returns {Promise<Object>} 현재 위치 정보
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

/**
 * 이미지 파일 압축
 * @param {File} file - 원본 이미지 파일
 * @param {number} maxSize - 최대 파일 크기 (bytes)
 * @returns {Promise<File>} 압축된 이미지 파일
 */
export const compressImage = async (file, maxSize = 1024 * 1024) => {
  if (file.size <= maxSize) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // 이미지 크기 조정
        const ratio = Math.min(maxSize / file.size, 1);
        width *= ratio;
        height *= ratio;
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // 압축된 이미지를 File 객체로 변환 (품질 1.0으로 설정)
        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: file.type,
              lastModified: file.lastModified
            }));
          },
          file.type,
          1.0 // 최대 품질로 설정
        );
      };
    };
  });
}; 