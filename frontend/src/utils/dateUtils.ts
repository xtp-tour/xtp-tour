export const formatTime = (time: number): string => {
  return String(time).padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2');
}; 