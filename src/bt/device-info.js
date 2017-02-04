const append = console.log;

const val = async (char) => {
  const value = await char.readValue();
  return new TextDecoder('utf8').decode(value);
};

const read = async () => {
  const device = await navigator.bluetooth.requestDevice({ 
    acceptAllDevices: true,
    optionalServices: ['device_information']
  });
  append(`Got Device: ${device.name}`);
  const server = await device.gatt.connect();
  append('Connected to Server');
  const service = await server.getPrimaryService('device_information');

  
  const characteristic = await service.getCharacteristic('manufacturer_name_string');
  /* can't get:
   * model_number_string
   * serial_number_string
   */
  const char = await val(characteristic);
  return {
    name: device.name,
    manufacturer: char
  };
};

export default read;


