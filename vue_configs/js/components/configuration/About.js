/*
 * @Author: hduwhyso 389665028@qq.com
 * @Date: 2025-07-03 19:38:16
 * @LastEditTime: 2025-07-03 23:29:18
 * @Description: 
 */

const MarkdownPreview = {
  name: 'MarkdownPreview',
  props: {
    text: String
  },
  data () {
    return {
    }
  },
  computed: {
    markdownHtml: function () {
      try {
        return Mdjs.md2html(this.text).replace(/href="#[^"]+"/g, 'href="javascript:void(0);"')
      } catch (e) {
        return this.text
      }
    }
  },
  template: `
    <p v-html="markdownHtml" class="markdown-preview" style="width: 100%;word-break: break-all;"></p>
  `
}
const HistoryRelease = {
  name: 'HistoryRelease',
  components: { MarkdownPreview },
  data () {
    return {
      loading: false,
      releasesUrl: 'https://api.github.com/repos/TonyJiangWJ/Ant-Manor/releases',
      historyReleases: []
    }
  },
  filters: {
    dateStr: function (value) {
      // console.log('date: ', value)
      return formatDate(new Date(value))
    }
  },
  methods: {
    loadHistoryReleases: function () {
      this.loadReleasesUrlByConfig().then(_ => {
        this.loading = true
        return API.get(this.releasesUrl).then(resp => {
          let queryResult = resp
          this.historyReleases = queryResult.map(({ tag_name, created_at, published_at, body }) => ({ tagName: tag_name, createdAt: created_at, publishedAt: published_at, body }))
          return Promise.resolve(true)
        }).catch(e => {
          console.error('请求失败', e)
          return Promise.resolve(false)
        }).then(_ => this.loading = false)
      })
    },
    loadReleasesUrlByConfig: function () {
      return new Promise(resolve => {
        if ($app.mock) {
          resolve(this.releasesUrl)
          return
        }
        $app.invoke('loadConfigs', {}, config => {
          this.releasesUrl = (config.github_latest_url || '').replace('/latest', '') || this.releasesUrl
          console.log('替换历史releaseUrl为：', this.releasesUrl)
          resolve(this.releasesUrl)
        })
      })
    }
  },
  mounted () {
    this.loadHistoryReleases()
  },
  template: `
   <div style="width: 100%">
    <div v-for="release in historyReleases" :key="release.tagName" style="margin: 1rem;padding: 1rem;box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;">
      <h4>{{release.tagName}}</h4>
      <div style="display:inline">
        <label style="font-size: 0.75rem;">{{release.publishedAt|dateStr}} => {{release.createdAt|dateStr}}</label>
      </div>
      <markdown-preview :text="release.body" />
    </div>
    <van-overlay :show="loading" z-index="1000">
      <div class="wrapper">
        <van-loading size="4rem" vertical>加载中...</van-loading>
      </div>
    </van-overlay>
   </div>
  `
}

/**
 * 关于项目
 */
const About = {
  name: 'About',
  mixins: [mixin_common],
  data () {
    return {
      version: 'develop_version',
      githubUrl: '',
      giteeUrl: '',
      configs: {
        github_latest_url: '',
        history_tag_url: '',
        gitee_relase_url: '',
        gitee_package_prefix: '',
        gitee_package_url: '',
        release_access_token: '',
      },
    }
  },
  methods: {
    openGithubUrl: function () {
      console.log('点击url')
      $app.invoke('openUrl', { url: this.githubUrl })
    },
    openGiteeUrl: function () {
      console.log('点击url')
      $app.invoke('openUrl', { url: this.giteeUrl })
    },
    checkForUpdate: function () {
      $app.invoke('downloadUpdate')
    },
    showReleases: function () {
      this.$router.push('/about/releases')
    },
  },
  computed: {
    githubShort: function () {
      if (this.githubUrl) {
        return this.githubUrl.replace(/https:\/\/(\w+\.)\w+\//, '')
      }
      return ''
    },
    giteeShort: function () {
      if (this.giteeUrl) {
        return this.giteeUrl.replace(/https:\/\/(\w+\.)\w+\//, '')
      }
      return ''
    }
  },
  mounted () {
    window.$nativeApi.request('getLocalVersion').then(r => {
      this.version = r.versionName
    })
    window.$nativeApi.request('loadConfigs').then(config => {
      this.githubUrl = config.github_url
      this.giteeUrl = config.gitee_url
    })
  },
  template: `
  <div class="about">
    <van-cell-group>
      <van-cell title="版本" :value="version"/>
      <van-cell title="检测更新" value="点击更新" @click="checkForUpdate"/>
      <van-cell title="更新历史" value="点击查看" @click="showReleases"/>
      <van-cell title="作者" value="Chase"/>
      <van-cell title="Email" value="389665028@qq.com"/>
      <van-cell value-class="long-value" v-if="githubShort" title="Github" :value="githubShort" @click="openGithubUrl"/>
      <van-cell value-class="long-value" v-if="giteeShort" title="Gitee" :value="giteeShort" @click="openGiteeUrl"/>
    </van-cell-group>
    <tip-block>本脚本免费使用，更新渠道只有Github<template v-if="giteeShort">和Gitee</template>，请不要被其他引流渠道欺骗了</tip-block>
  </div>
  `
}


