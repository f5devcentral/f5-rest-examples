/*
  Copyright (c) 2017, F5 Networks, Inc.
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  *
  http://www.apache.org/licenses/LICENSE-2.0
  *
  Unless required by applicable law or agreed to in writing,
  software distributed under the License is distributed on an
  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
  either express or implied. See the License for the specific
  language governing permissions and limitations under the License.
*/

"use strict";

/**
 * This is a sample worker for using pub/sub in nodejs .
 * onPost - will create subscription according to provided details.
 * onDelete -  will ubsubscribe from the subscription.
 * If syncInterval provided the subscription will include periodicFullSync.
 * Note : it can only be subscribed to one topic at a time.
 */

class SubscriptionListenerWorker {

    constructor() {
        this.isPublic = true;
        this.WORKER_URI_PATH = "shared/samples/listener";
        this.topic = null;
        this.subscriptionId = null;
    }

    /**
     * Returns the subscriptionId and the notifications
     * @param {RestOperation} request
     */
    onGet(request) {
        let result = {
            "topic" : this.topic,
            "subscriptionId": this.subscriptionId,
            "notifications": this.notifications,
            "totalNotifications": this.totalNotifications,
            "lostNotifications" : this.lostNotifications,
            "syncInvocations" : this.numberOfSyncInvocations
        };
        request.setBody(result);
        this.completeRestOperation(request);
    }

    /**
     * Creates subscription  according to subscription details :
     *  subscribeTo  (mandatory) the public URI of the topic you want to subscribeTo (e.g. /mgmt/shared/echo)
     *  matchDepth   (optional) the matchDepth of the subscription
     *  syncInterval (opitional) interval in milliseconds for calling the periodicFullSync
     * @param {RestOperation} request
     */
    onPost(request) {
        if(this.subscriptionId) {
            request.fail(new Error("Already subscribed to a topic, do unsubscirbe before subscribing to new topic"));
            return;
        }
        this.clearNotifications();
        let subscriptionDetails = request.getBody();
        if(!subscriptionDetails.subscribeTo) {
            request.fail(new Error("Must provide subscribeTo"));
            return;
        }

        let subscriptionRequest = {
            "topic": subscriptionDetails.subscribeTo,
            "matchDepth":  subscriptionDetails.matchDepth ,
            "id": this.restHelper.generateUuidString(),
            "subscribeCallback": this.subscribeCallback.bind(this),
            "notifyCallback": this.notifyCallback.bind(this),
            "notifyLostCallback" : this.notifyLostCallback.bind(this)
        };
        if(subscriptionDetails.syncInterval) {
            subscriptionRequest.periodicFullSync = this.periodicFullSync.bind(this);
            subscriptionRequest.fullSyncInterval = subscriptionDetails.syncInterval;
        }
        this.subscribe(subscriptionRequest);
        this.topic = subscriptionDetails.subscribeTo;
        request.complete();
    }

    clearNotifications() {
        this.notifications = {};
        this.totalNotifications = 0;
        this.lostNotifications = 0;
        this.numberOfSyncInvocations = 0;
    }
     /**
     * Will ubsubscirbe from existing topic if subscription exist
     * @param {RestOperation} request
     */
    onDelete(request) {
        if(!this.subscriptionId) {
            this.logger.info("Not subscribed");
            request.complete();
        }

        this.unsubscribe(this.subscriptionId);
        this.subscriptionId = null;
        this.topic = null;
        this.clearNotifications();
        request.complete();
    }

    /**
     * Function to be called upon succeesfull subscription
     * @param {String} token
     */
    subscribeCallback(error, subscriptionId) {
        if(error) {
            this.logger.info("Failed to create subscription : %s" , error.message);
            return;
        }
        this.logger.info("Subscription created, subscription token : %s", subscriptionId);
        this.subscriptionId = subscriptionId;
    }

    /**
     * Function to be called when notification is sent
     * @param {RestOperation} notification
     */
    notifyCallback(notification) {
        this.logger.info("Got notification for verb:" + notification.getMethod());
        let verb = notification.getMethod();
        let notificationData = {
            "body": notification.getBody(),
            "headers": notification.getHeaders()
        };

        let verbNotifications = this.notifications[verb];
        if (!verbNotifications) {
            verbNotifications = [];
            this.notifications[verb] = verbNotifications;
        }
        this.totalNotifications++;
        verbNotifications.push(notificationData);
    }

    notifyLostCallback() {
        this.logger.info("Got notifyLostCallBack");
        this.lostNotifications++;
    }

    periodicFullSync() {
        this.numberOfSyncInvocations++;
        this.logger.finest("Got periodicFullSync call number: " + this.numberOfSyncInvocations);
    }
}

module.exports = SubscriptionListenerWorker;