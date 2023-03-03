const parseTime = (time) => {
  if (time.includes('h') && !time.includes('m')) {
    time += ' 0m'
  } else if (!time.includes('h') && time.includes('m')) {
    time = '0h ' + time
  }
  const [hours, minutes] = time.split(' ').map((value) => parseInt(value))
  const totalMilliseconds = hours * 60 * 60 * 1000 + minutes * 60 * 1000
  return totalMilliseconds
}

const formatTime = (timeString) => {
  const time = new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return time
}

const sumTimes = (times) => {
  const totalMilliseconds = times.reduce((total, time) => total + parseTime(time), 0)
  const hours = Math.floor(totalMilliseconds / (60 * 60 * 1000))
  const minutes = Math.floor((totalMilliseconds / (60 * 1000)) % 60)
  return `${hours}h ${minutes}m`
}

const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/')
  const paddedDay = day.padStart(2, '0')
  const paddedMonth = month.padStart(2, '0')
  let fullYear = parseInt(year)
  if (fullYear < 100) {
    fullYear += 2000
  }
  const date = new Date(`${fullYear}-${paddedMonth}-${paddedDay}T00:00:00Z`)
  return date
}

const formatDate = (dateString) => {
  const date = new Date(dateString).toLocaleDateString()
  return date
}

const formatCurrency = (number) => {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    trailingZeroDisplay: 'auto',
  }).format(number)
  return amount
}

const sumNumbers = (numbers) => {
  return numbers.reduce((total, number) => total + number, 0)
}

export { parseTime, formatTime, sumTimes, parseDate, formatDate, formatCurrency, sumNumbers }
