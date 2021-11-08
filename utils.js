const urlRegex = /http[s]{0,1}:\/\/([\w.]+\/?)\S*/

function checkUrl(url) {
  return urlRegex.test(url)
}

module.exports = {
  checkUrl
}