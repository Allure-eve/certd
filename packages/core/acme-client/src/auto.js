/**
 * ACME auto helper
 */

const { readCsrDomains } = require('./crypto');
const { log } = require('./logger');
const { wait } = require('./wait');

const defaultOpts = {
    csr: null,
    email: null,
    preferredChain: null,
    termsOfServiceAgreed: false,
    skipChallengeVerification: false,
    challengePriority: ['http-01', 'dns-01'],
    challengeCreateFn: async () => { throw new Error('Missing challengeCreateFn()'); },
    challengeRemoveFn: async () => { throw new Error('Missing challengeRemoveFn()'); }
};


/**
 * ACME client auto mode
 *
 * @param {AcmeClient} client ACME client
 * @param {object} userOpts Options
 * @returns {Promise<buffer>} Certificate
 */

module.exports = async function(client, userOpts) {
    const opts = Object.assign({}, defaultOpts, userOpts);
    const accountPayload = { termsOfServiceAgreed: opts.termsOfServiceAgreed };

    if (!Buffer.isBuffer(opts.csr)) {
        opts.csr = Buffer.from(opts.csr);
    }

    if (opts.email) {
        accountPayload.contact = [`mailto:${opts.email}`];
    }


    /**
     * Register account
     */

    log('[auto] Checking account');

    try {
        client.getAccountUrl();
        log('[auto] Account URL already exists, skipping account registration');
    }
    catch (e) {
        log('[auto] Registering account');
        await client.createAccount(accountPayload);
    }


    /**
     * Parse domains from CSR
     */

    log('[auto] Parsing domains from Certificate Signing Request');
    const { commonName, altNames } = readCsrDomains(opts.csr);
    const uniqueDomains = Array.from(new Set([commonName].concat(altNames).filter((d) => d)));

    log(`[auto] Resolved ${uniqueDomains.length} unique domains from parsing the Certificate Signing Request`);


    /**
     * Place order
     */

    log('[auto] Placing new certificate order with ACME provider');
    const orderPayload = { identifiers: uniqueDomains.map((d) => ({ type: 'dns', value: d })) };
    const order = await client.createOrder(orderPayload);
    const authorizations = await client.getAuthorizations(order);

    log(`[auto] Placed certificate order successfully, received ${authorizations.length} identity authorizations`);


    /**
     * Resolve and satisfy challenges
     */

    log('[auto] Resolving and satisfying authorization challenges');

    const clearTasks = [];

    const challengeFunc = async (authz) => {
        const d = authz.identifier.value;
        let challengeCompleted = false;

        /* Skip authz that already has valid status */
        if (authz.status === 'valid') {
            log(`[auto] [${d}] Authorization already has valid status, no need to complete challenges`);
            return;
        }

        try {
            /* Select challenge based on priority */
            const challenge = authz.challenges.sort((a, b) => {
                const aidx = opts.challengePriority.indexOf(a.type);
                const bidx = opts.challengePriority.indexOf(b.type);

                if (aidx === -1) return 1;
                if (bidx === -1) return -1;
                return aidx - bidx;
            }).slice(0, 1)[0];

            if (!challenge) {
                throw new Error(`Unable to select challenge for ${d}, no challenge found`);
            }

            log(`[auto] [${d}] Found ${authz.challenges.length} challenges, selected type: ${challenge.type}`);

            /* Trigger challengeCreateFn() */
            log(`[auto] [${d}] Trigger challengeCreateFn()`);
            const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
            let recordItem = null;
            try {
                recordItem = await opts.challengeCreateFn(authz, challenge, keyAuthorization);
                log(`[auto] [${d}] challengeCreateFn success`);
                log(`[auto] [${d}] add challengeRemoveFn()`);
                clearTasks.push(async () => {
                    /* Trigger challengeRemoveFn(), suppress errors */
                    log(`[auto] [${d}] Trigger challengeRemoveFn()`);
                    try {
                        await opts.challengeRemoveFn(authz, challenge, keyAuthorization, recordItem);
                    }
                    catch (e) {
                        log(`[auto] [${d}] challengeRemoveFn threw error: ${e.message}`);
                    }
                });
                // throw new Error('测试异常');
                /* Challenge verification */
                if (opts.skipChallengeVerification === true) {
                    log(`[auto] [${d}] Skipping challenge verification since skipChallengeVerification=true`);
                }
                else {
                    log(`[auto] [${d}] Running challenge verification`);
                    await client.verifyChallenge(authz, challenge);
                }

                /* Complete challenge and wait for valid status */
                log(`[auto] [${d}] Completing challenge with ACME provider and waiting for valid status`);
                await client.completeChallenge(challenge);
                challengeCompleted = true;

                await client.waitForValidStatus(challenge);
            }
            catch (e) {
                log(`[auto] [${d}] challengeCreateFn threw error: ${e.message}`);
                throw e;
            }
        }
        catch (e) {
            /* Deactivate pending authz when unable to complete challenge */
            if (!challengeCompleted) {
                log(`[auto] [${d}] Unable to complete challenge: ${e.message}`);

                try {
                    log(`[auto] [${d}] Deactivating failed authorization`);
                    await client.deactivateAuthorization(authz);
                }
                catch (f) {
                    /* Suppress deactivateAuthorization() errors */
                    log(`[auto] [${d}] Authorization deactivation threw error: ${f.message}`);
                }
            }

            throw e;
        }
    };

    const challengePromises = authorizations.map((authz) => async () => {
        await challengeFunc(authz);
    });


    function runAllPromise(tasks) {
        let promise = Promise.resolve();
        tasks.forEach((task) => {
            promise = promise.then(task);
        });
        return promise;
    }

    async function runPromisePa(tasks) {
        const results = [];
        // eslint-disable-next-line no-await-in-loop,no-restricted-syntax
        for (const task of tasks) {
            results.push(task());
            // eslint-disable-next-line no-await-in-loop
            await wait(10000);
        }
        return Promise.all(results);
    }


    try {
        log('开始challenge');
        await runPromisePa(challengePromises);

        log('challenge结束');

        // log('[auto] Waiting for challenge valid status');
        // await Promise.all(challengePromises);

        /**
         * Finalize order and download certificate
         */

        log('[auto] Finalizing order and downloading certificate');
        const finalized = await client.finalizeOrder(order, opts.csr);
        return await client.getCertificate(finalized, opts.preferredChain);
    }
    catch (e) {
        log('证书申请失败');
        throw e;
    }
    finally {
        log(`清理challenge痕迹，length:${clearTasks.length}`);
        await runAllPromise(clearTasks);
    }

    // try {
    //     await Promise.allSettled(challengePromises);
    // }
    // finally {
    //     log('清理challenge');
    //     await Promise.allSettled(clearTasks);
    // }
};
