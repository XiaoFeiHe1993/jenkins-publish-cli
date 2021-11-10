#!/usr/bin/env node

const pkg = require('./package.json')
const { Command } = require('commander')
const chalk = require('chalk')
const inquirer = require('inquirer')
const utils = require('./utils.js')
const jenkins = require("./jenkins.js")

const program = new Command()

program.usage('[command] [options]').version(pkg.version, '-V')

program.on('--help', () => {})

program
  .command('publish')
  .description('通过jenkins发布测试环境项目')
  .action(() => {
    console.log(chalk.green('初始化'))
    let startTime = new Date().getTime()
    const argus = process.argv.slice(2, process.argv.length)
    let local = require('node-localstorage').LocalStorage
    let localStorage = new local('./jenkins')
    if (!localStorage.getItem('jenkins-projects')) {
      console.log(chalk.red('请先执行 jupdate project 完成项目配置'))
      process.exit(0)
    }
    projects = JSON.parse(localStorage.getItem('jenkins-projects'))
    if (argus[1] && projects[argus[1]]) {
      jenkins.startBuildTestProject({
        url: projects[argus[1]].url,
        buildUrl: `${projects[argus[1]].projectUrl}/build/api/json`,
        searchUrl: `${projects[argus[1]].projectUrl}/lastSuccessfulBuild/api/json`,
        startTime,
      })
    } else {
      console.log(chalk.red('请先执行 jupdate project 完成项目配置'))
    }
  })

const userAsk = () => {
  const prompts = []
  prompts.push({
    type: 'input',
    name: 'jenkinsUsername',
    message: '请输入jenkins用户名',
  })
  prompts.push({
    type: 'password',
    name: 'jenkinsPassword',
    message: '请输入jenkins密码',
  })
  return inquirer.prompt(prompts)
}
program
  .command('user')
  .description('配置jenkins管理员用户名、密码')
  .action(() => {
    userAsk().then((answers) => {
      let local = require('node-localstorage').LocalStorage
      let localStorage = new local('./jenkins')
      localStorage.setItem('jenkins-username', answers.jenkinsUsername)
      localStorage.setItem('jenkins-password', answers.jenkinsPassword)
    })
  })

const projectAsk = () => {
  const prompts = []
  prompts.push({
    type: 'input',
    name: 'projectName',
    message: '请输入jenkins项目名',
  })
  prompts.push({
    type: 'input',
    name: 'jenkinsUrl',
    message: '请输入jenkins地址',
  })
  prompts.push({
    type: 'input',
    name: 'projectUrl',
    message: '请输入jenkins项目地址',
  })
  return inquirer.prompt(prompts)
}
program
  .command('project')
  .description('配置jenkins项目')
  .action(() => {
    projectAsk().then((answers) => {
      if (!utils.checkUrl(answers.jenkinsUrl) || !utils.checkUrl(answers.projectUrl)) {
        console.log(chalk.red('请输入正确的url'))
        process.exit(0)
      }
      let local = require('node-localstorage').LocalStorage
      let localStorage = new local('./jenkins')
      let projects = {}
      if (localStorage.getItem('jenkins-projects')) {
        projects = JSON.parse(localStorage.getItem('jenkins-projects'))
      }
      projects[answers.projectName] = {
        url: answers.jenkinsUrl,
        projectUrl: answers.projectUrl,
      }
      localStorage.setItem('jenkins-projects', JSON.stringify(projects))
    })
  })

program.parse(process.argv)
