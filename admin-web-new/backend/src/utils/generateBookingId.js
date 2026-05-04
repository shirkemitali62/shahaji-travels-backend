const generateBookingId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BK${Date.now()}${random}`;
};

export default generateBookingId;