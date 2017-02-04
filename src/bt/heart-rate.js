const connect = async (cb) => {
  const device = await navigator.bluetooth.requestDevice( { filters: [{ services: ['heart_rate'] }] });
  const server =  await device.gatt.connect();
  const service = await server.getPrimaryService('heart_rate');
  const characteristic = await service.getCharacteristic('heart_rate_measurement');
  await characteristic.startNotifications();
  characteristic.addEventListener('characteristicvaluechanged', cb);
};

export default connect;
