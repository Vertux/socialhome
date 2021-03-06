import Axios from "axios"
import moxios from "moxios"
import Vue from "vue"
import {mount} from "avoriaz"

import BootstrapVue from "bootstrap-vue"
import VueMasonryPlugin from "vue-masonry"

import ReactionsBar from "streams/app/components/ReactionsBar.vue"
import {getContextWithFakePosts, getFakePost} from "streams/app/tests/fixtures/jsonContext.fixtures"
import {newStreamStore} from "streams/app/stores/streamStore"
import applicationStore from "streams/app/stores/applicationStore"


Vue.use(BootstrapVue)
Vue.use(VueMasonryPlugin)

describe("ReactionsBar", () => {
    let store

    beforeEach(() => {
        Sinon.restore()

        let contentList = [getFakePost({id: 1})]
        window.context = getContextWithFakePosts({contentList}, 0)
        store = newStreamStore({modules: {applicationStore}})
    })

    describe("computed", () => {
        describe("showReplies", () => {
            it("should be true if user is authenticated or content has replies", () => {
                let target = mount(ReactionsBar, {
                    propsData: {contentId: 1},
                    store,
                })

                target.instance().$store.state.contents[1].repliesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().showReplies.should.be.true

                target.instance().$store.state.contents[1].repliesCount = 1
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showReplies.should.be.true

                target.instance().$store.state.contents[1].repliesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showReplies.should.be.false
            })
        })

        describe("showShares", () => {
            it("should be true if user is authenticated or content has shares", () => {
                let target = mount(ReactionsBar, {
                    propsData: {contentId: 1},
                    store,
                })

                target.instance().$store.state.contents[1].sharesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().showShares.should.be.true

                target.instance().$store.state.contents[1].sharesCount = 1
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showShares.should.be.true

                target.instance().$store.state.contents[1].sharesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showShares.should.be.false
            })

            it("should be fa if user is authenticated or content has shares", () => {
                let target = mount(ReactionsBar, {
                    propsData: {contentId: 1},
                    store,
                })

                target.instance().$store.state.contents[1].sharesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().showShares.should.be.true

                target.instance().$store.state.contents[1].sharesCount = 1
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showShares.should.be.true

                target.instance().$store.state.contents[1].sharesCount = 0
                target.instance().$store.state.applicationStore.isUserAuthenticated = false
                target.instance().showShares.should.be.false
            })
        })
    })

    describe("methods", () => {
        beforeEach(() => {
            Vue.prototype.$http = Axios.create({
                xsrfCookieName: "csrftoken",
                xsrfHeaderName: "X-CSRFToken",
            })
            moxios.install(Vue.prototype.$http)
        })

        afterEach(() => {
            moxios.uninstall()
        })

        describe("expandShares", () => {
            it("should toggle showSharesBox", () => {
                let target = new ReactionsBar({contentId: 1})
                target.expandShares()
                target.showSharesBox.should.be.true
                target.expandShares()
                target.showSharesBox.should.be.false
            })
        })

        describe("share", () => {
            it("should show the reshare bow", () => {
                let target = mount(ReactionsBar, {propsData: {contentId: 1}, store})
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().$store.state.contents[1].isUserAuthor = false
                target.instance().$data.showRepliesBox = true

                target.instance().expandShares()
                target.instance().$data.showSharesBox.should.be.true
            })

            it("should create share on server", (done) => {
                let target = mount(ReactionsBar, {propsData: {contentId: 1}, store})
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().$store.state.contents[1].hasShared = false
                target.instance().$store.state.contents[1].isUserAuthor = false

                // Ensure data
                target.instance().expandShares()
                target.instance().showSharesBox.should.be.true
                target.instance().$store.state.contents[1].hasShared.should.be.false
                target.instance().$store.state.contents[1].sharesCount = 12

                target.instance().share()

                moxios.wait(() => {
                    moxios.requests.mostRecent().respondWith({
                        status: 200,
                        response: {status: "ok", content_id: 123},
                    }).then(() => {
                        target.instance().$data.showSharesBox.should.be.false
                        target.instance().$store.state.contents[1].hasShared.should.be.true
                        target.instance().$store.state.contents[1].sharesCount.should.eq(13)
                        done()
                    })
                })
            })
        })

        describe("unshare", () => {
            it("should removes share on server", (done) => {
                let target = mount(ReactionsBar, {propsData: {contentId: 1}, store})
                target.instance().$store.state.applicationStore.isUserAuthenticated = true
                target.instance().$store.state.contents[1].hasShared = true
                target.instance().$store.state.contents[1].isUserAuthor = false

                // Ensure data
                target.instance().expandShares()
                target.instance().showSharesBox.should.be.true
                target.instance().$store.state.contents[1].hasShared.should.be.true
                target.instance().$store.state.contents[1].sharesCount = 12

                // Actual thing we are testing - the unshare
                target.instance().unshare()

                moxios.wait(() => {
                    moxios.requests.mostRecent().respondWith({
                        status: 200,
                        response: {status: "ok"},
                    }).then(() => {
                        target.instance().showSharesBox.should.be.false
                        target.instance().$store.state.contents[1].sharesCount.should.eq(11)
                        target.instance().$store.state.contents[1].hasShared.should.be.false
                        done()
                    })
                })
            })
        })
    })
})
