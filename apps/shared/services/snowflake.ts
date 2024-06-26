export function generateNumber(n: number): number {
  const start = Math.pow(10, n - 1)
  const end = Math.pow(10, n) - 1

  return Math.floor(Math.random() * (end - start + 1) + start)
}

export function generateSnowflake(): string {
  const timestamp = Date.now()
  // remove the first 3 digits of the timestamp
  // and keep the last 9 digits

  const timestampStr = timestamp.toString().slice(7)
  console.log('TimestampStr:', timestampStr)
  console.log('Timestamp:', timestamp)

  const machineId = generateNumber(5)
  const sequence = generateNumber(4)

  console.log('MachineId:', machineId)

  return `${machineId}${timestampStr}${sequence}`
}