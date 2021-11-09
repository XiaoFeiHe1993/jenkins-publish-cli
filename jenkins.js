const axios = require('axios')
const chalk = require('chalk')
const ora = require('ora')

const spinner = ora('loading...')

function getUserConfig() {
  let local = require('node-localstorage').LocalStorage
  let localStorage = new local('./jenkins')
  if (!localStorage.getItem('jenkins-username') || !localStorage.getItem('jenkins-password')) {
    console.log(chalk.red('请先执行 jpublish user 命令，配置系统用户名、密码。'))
    process.exit(0)
  }
  return { username: localStorage.getItem('jenkins-username'), password: localStorage.getItem('jenkins-password') }
}

function startBuildTestProject({ url, buildUrl, searchUrl, startTime }) {
  const { username, password } = getUserConfig()
  axios
    .get(`${url}/crumbIssuer/api/json`, {
      auth: {
        username,
        password,
      },
    })
    .then((res) => {
      if (res && res.data) {
        const { crumb } = res.data
        startBuildJob({ buildUrl, searchUrl, username, password, crumb, startTime })
      }
    })
    .catch((error) => {
      console.log('error', chalk.red(error))
    })
}

function startBuildJob({ buildUrl, searchUrl, username, password, crumb, startTime }) {
  console.log(chalk.green('开始build项目'))
  axios
    .post(
      buildUrl,
      {},
      {
        headers: {
          'Jenkins-Crumb': crumb,
        },
        auth: {
          username,
          password,
        },
      }
    )
    .then((res) => {
      if (res) {
        startSearchResult({ searchUrl, username, password, crumb, startTime })
      }
    })
    .catch((error) => {
      console.log('error', chalk.red(error))
    })
}

function startSearchResult({ searchUrl, username, password, crumb, startTime }) {
  console.log(chalk.green('查询执行结果'))
  spinner.start()
  const loopId = setInterval(() => {
    axios
      .post(
        searchUrl,
        {},
        {
          headers: {
            'Jenkins-Crumb': crumb,
          },
          auth: {
            username,
            password,
          },
        }
      )
      .then((res) => {
        if (res && res.data && res.data.timestamp > startTime) {
          spinner.stop()
          clearInterval(loopId)
          console.log(chalk.green('发布成功'))
          process.exit(0)
        } else {
          const date = new Date()
          console.log(chalk.green(`${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`))
        }
      })
      .catch((error) => {
        console.log('error', chalk.red(error))
      })
  }, 60000)
}

module.exports = {
  startBuildTestProject,
}
