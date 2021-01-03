import chai from 'chai'
import { Certd } from '../src/index.js'
import { createOptions } from '../../../test/options.js'
const { expect } = chai
const fakeCrt = `-----BEGIN CERTIFICATE-----
MIIFSTCCBDGgAwIBAgITAPoZZk/LhVIyXoic2NnJyxubezANBgkqhkiG9w0BAQsF
ADAiMSAwHgYDVQQDDBdGYWtlIExFIEludGVybWVkaWF0ZSBYMTAeFw0yMDEyMTQx
NjA1NTFaFw0yMTAzMTQxNjA1NTFaMBsxGTAXBgNVBAMMECouZG9jbWlycm9yLmNs
dWIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC75tGrYjly+RpcZehQ
my1EpaXElT4L60pINKV2YDKnBrcSSo1c6rO7nFh12eC/ju4WwYUep0RVmBDF8xD0
I1Sd1uuDTQWP0UT1X9yqdXtjvxpUqoCHAzG633f3sJRFul7mDLuC9tRCuae9o7qP
EZ827XOmjBR35dso9I2GEE4828J3YE3tSKtobZlM+30jozLEcsO0PTyM5mq5PPjP
VI3fGLcEaBmLZf5ixz4XkcY9IAhyAMYf03cT2wRoYPBaDdXblgCYL6sFtIMbzl3M
Di94PB8NyoNSsC2nmBdWi54wFOgBvY/4ljsX/q7X3EqlSvcA0/M6/c/J9kJ3eupv
jV8nAgMBAAGjggJ9MIICeTAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYB
BQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFAkdTjSCV3KD
x28sf98MrwVfyFYgMB8GA1UdIwQYMBaAFMDMA0a5WCDMXHJw8+EuyyCm9Wg6MHcG
CCsGAQUFBwEBBGswaTAyBggrBgEFBQcwAYYmaHR0cDovL29jc3Auc3RnLWludC14
MS5sZXRzZW5jcnlwdC5vcmcwMwYIKwYBBQUHMAKGJ2h0dHA6Ly9jZXJ0LnN0Zy1p
bnQteDEubGV0c2VuY3J5cHQub3JnLzArBgNVHREEJDAighAqLmRvY21pcnJvci5j
bHVigg5kb2NtaXJyb3IuY2x1YjBMBgNVHSAERTBDMAgGBmeBDAECATA3BgsrBgEE
AYLfEwEBATAoMCYGCCsGAQUFBwIBFhpodHRwOi8vY3BzLmxldHNlbmNyeXB0Lm9y
ZzCCAQQGCisGAQQB1nkCBAIEgfUEgfIA8AB1ABboacHRlerXw/iXGuPwdgH3jOG2
nTGoUhi2g38xqBUIAAABdmI3LM4AAAQDAEYwRAIgaiNqXSEq+sxp8eqlJXp/KFdO
so5mT50MoRsLF8Inu0ACIDP46+ekng7I0BlmyIPmbqFcZgnZFVWLLCdLYijhVyOL
AHcA3Zk0/KXnJIDJVmh9gTSZCEmySfe1adjHvKs/XMHzbmQAAAF2YjcuxwAABAMA
SDBGAiEAxpeB8/w4YkHZ62nH20h128VtuTSmYDCnF7EK2fQyeZYCIQDbJlF2wehZ
sF1BeE7qnYYqCTP0dYIrQ9HWtBa/MbGOKTANBgkqhkiG9w0BAQsFAAOCAQEAL2di
HKh6XcZtGk0BFxJa51sCZ3MLu9+Zy90kCRD4ooP5x932WxVM25+LBRd+xSzx+TRL
UVrlKp9GdMYX1JXL4Vf2NwzuFO3snPDe/qizD/3+D6yo8eKJ/LD82t5kLWAD2rto
YfVSTKwfNIBBJwHUnjviBPJmheHHCKmz8Ct6/6QxFAeta9TAMn0sFeVCQnmAq7HL
jrunq0tNHR/EKG0ITPLf+6P7MxbmpYNnq918766l0tKsW8oo8ZSGEwKU2LMaSiAa
hasyl/2gMnYXjtKOjDcnR8oLpbrOg0qpVbynmJin1HP835oHPPAZ1gLsqYTTizNz
AHxTaXliTVvS83dogw==
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
MIIEqzCCApOgAwIBAgIRAIvhKg5ZRO08VGQx8JdhT+UwDQYJKoZIhvcNAQELBQAw
GjEYMBYGA1UEAwwPRmFrZSBMRSBSb290IFgxMB4XDTE2MDUyMzIyMDc1OVoXDTM2
MDUyMzIyMDc1OVowIjEgMB4GA1UEAwwXRmFrZSBMRSBJbnRlcm1lZGlhdGUgWDEw
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDtWKySDn7rWZc5ggjz3ZB0
8jO4xti3uzINfD5sQ7Lj7hzetUT+wQob+iXSZkhnvx+IvdbXF5/yt8aWPpUKnPym
oLxsYiI5gQBLxNDzIec0OIaflWqAr29m7J8+NNtApEN8nZFnf3bhehZW7AxmS1m0
ZnSsdHw0Fw+bgixPg2MQ9k9oefFeqa+7Kqdlz5bbrUYV2volxhDFtnI4Mh8BiWCN
xDH1Hizq+GKCcHsinDZWurCqder/afJBnQs+SBSL6MVApHt+d35zjBD92fO2Je56
dhMfzCgOKXeJ340WhW3TjD1zqLZXeaCyUNRnfOmWZV8nEhtHOFbUCU7r/KkjMZO9
AgMBAAGjgeMwgeAwDgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAw
HQYDVR0OBBYEFMDMA0a5WCDMXHJw8+EuyyCm9Wg6MHoGCCsGAQUFBwEBBG4wbDA0
BggrBgEFBQcwAYYoaHR0cDovL29jc3Auc3RnLXJvb3QteDEubGV0c2VuY3J5cHQu
b3JnLzA0BggrBgEFBQcwAoYoaHR0cDovL2NlcnQuc3RnLXJvb3QteDEubGV0c2Vu
Y3J5cHQub3JnLzAfBgNVHSMEGDAWgBTBJnSkikSg5vogKNhcI5pFiBh54DANBgkq
hkiG9w0BAQsFAAOCAgEABYSu4Il+fI0MYU42OTmEj+1HqQ5DvyAeyCA6sGuZdwjF
UGeVOv3NnLyfofuUOjEbY5irFCDtnv+0ckukUZN9lz4Q2YjWGUpW4TTu3ieTsaC9
AFvCSgNHJyWSVtWvB5XDxsqawl1KzHzzwr132bF2rtGtazSqVqK9E07sGHMCf+zp
DQVDVVGtqZPHwX3KqUtefE621b8RI6VCl4oD30Olf8pjuzG4JKBFRFclzLRjo/h7
IkkfjZ8wDa7faOjVXx6n+eUQ29cIMCzr8/rNWHS9pYGGQKJiY2xmVC9h12H99Xyf
zWE9vb5zKP3MVG6neX1hSdo7PEAb9fqRhHkqVsqUvJlIRmvXvVKTwNCP3eCjRCCI
PTAvjV+4ni786iXwwFYNz8l3PmPLCyQXWGohnJ8iBm+5nk7O2ynaPVW0U2W+pt2w
SVuvdDM5zGv2f9ltNWUiYZHJ1mmO97jSY/6YfdOUH66iRtQtDkHBRdkNBsMbD+Em
2TgBldtHNSJBfB3pm9FblgOcJ0FSWcUDWJ7vO0+NTXlgrRofRT6pVywzxVo6dND0
WzYlTWeUVsO40xJqhgUQRER9YLOLxJ0O6C8i0xFxAMKOtSdodMB3RIwt7RFQ0uyt
n5Z5MqkYhlMI3J1tPRTp1nEt9fyGspBOO05gi148Qasp+3N+svqKomoQglNoAxU=
-----END CERTIFICATE-----`
describe('Certd', function () {
  it('#buildCertDir', function () {
    const options = createOptions()
    options.cert.email = 'xiaojunnuo@qq.com'
    options.cert.domains = ['*.docmirror.club']
    const certd = new Certd(options)
    const currentRootPath = certd.certStore.currentRootPath
    console.log('rootDir', currentRootPath)
    expect(currentRootPath).match(/xiaojunnuo@qq.com\\certs\\_.docmirror.club\\current/)
  })
  it('#writeAndReadCert', async function () {
    const options = createOptions()
    options.cert.email = 'xiaojunnuo@qq.com'
    options.cert.domains = ['*.domain.cn']
    const certd = new Certd(options)
    await certd.writeCert({ csr: 'csr', crt: fakeCrt, key: 'bbb' })

    const cert = await certd.readCurrentCert()
    expect(cert).to.be.ok
    expect(cert.crt).ok
    expect(cert.key).to.be.ok
    expect(cert.detail).to.be.ok
    expect(cert.expires).to.be.ok
    console.log('expires:', cert.expires)
  })
})