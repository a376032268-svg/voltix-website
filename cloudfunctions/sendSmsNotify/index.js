/**
 * Voltix 短信通知云函数 - sendSmsNotify
 *
 * 触发条件：合作申请 / 联系我们表单提交成功后，由前端 callFunction 调用
 * 短信接收人：参见云函数环境变量 NOTIFY_PHONE
 *
 * 部署步骤：
 * 1. 登录腾讯云 SMS 控制台 https://console.cloud.tencent.com/smsv2
 * 2. 开通短信服务，创建签名（"Voltix伏特前行"），审核通过
 * 3. 创建模板（正文建议如下），审核通过后拿到 templateId
 *    - 合作申请模板：【Voltix伏特前行】您收到一条新合作申请，来自 {1}，联系电话：{2}，请登录管理后台处理。
 *    - 联系我们模板：【Voltix伏特前行】您收到一条新用户留言，类型：{1}，来自：{2}，请登录管理后台查看。
 * 4. 获取腾讯云 API 密钥（SecretId / SecretKey）
 *    https://console.cloud.tencent.com/cam/capi
 * 5. 在 CloudBase 控制台 -> 云函数 -> 新建云函数 -> 上传此文件夹
 *    或用 tcb 命令：tcb fn deploy sendSmsNotify -e voltix-prod-d9gpbrzsm7e719fc5
 * 6. 设置云函数环境变量（在控制台配置，不要写入代码）：
 *    - SECRET_ID   腾讯云 API SecretId
 *    - SECRET_KEY  腾讯云 API SecretKey
 *    - SMS_SDK_APP_ID  短信 SdkAppId（开通短信服务后获得）
 *    - NOTIFY_PHONE  接收通知的手机号（云函数环境变量中配置，不写入代码）
 *    - APP_TPL_ID    合作申请模板ID
 *    - CONTACT_TPL_ID 联系我们模板ID
 */

const tencentcloud = require('tencentcloud-sdk-nodejs');
const SmsClient = tencentcloud.sms.v20210111.Client;

exports.main = async (event) => {
  const { type, data } = event;

  const secretId = process.env.SECRET_ID;
  const secretKey = process.env.SECRET_KEY;
  const sdkAppId = process.env.SMS_SDK_APP_ID;
  const notifyPhone = process.env.NOTIFY_PHONE;
  const appTplId = process.env.APP_TPL_ID;
  const contactTplId = process.env.CONTACT_TPL_ID;

  if (!secretId || !secretKey || !sdkAppId) {
    console.error('[SMS] 缺少必要环境变量，请在云函数控制台配置');
    return { code: -1, msg: '缺少环境变量' };
  }

  const client = new SmsClient({
    credential: { secretId, secretKey },
    region: 'ap-guangzhou'
  });

  let templateId, templateParamSet;

  if (type === 'application') {
    templateId = appTplId;
    templateParamSet = [
      data.companyName || '未知公司',
      data.contactPhone || '未知'
    ];
  } else if (type === 'contact') {
    const typeMap = {
      purchase: '产品购买',
      partnership: '合作洽谈',
      invest: '投资合作',
      tech: '技术支持',
      other: '其他'
    };
    templateId = contactTplId;
    templateParamSet = [
      typeMap[data.contactType] || data.contactType || '其他',
      data.name || '未知用户'
    ];
  } else {
    return { code: -1, msg: '未知类型' };
  }

  const params = {
    SmsSdkAppId: sdkAppId,
    SignName: 'Voltix伏特前行',
    TemplateId: templateId,
    TemplateParamSet: templateParamSet,
    PhoneNumberSet: [`+86${notifyPhone}`]
  };

  try {
    const res = await client.SendSms(params);
    const status = res.SendStatusSet && res.SendStatusSet[0];
    if (status && status.Code === 'Ok') {
      console.log('[SMS] 发送成功:', status.Message);
      return { code: 0, msg: 'ok' };
    } else {
      console.error('[SMS] 发送失败:', status);
      return { code: -1, msg: status ? status.Message : '未知错误' };
    }
  } catch (e) {
    console.error('[SMS] 调用异常:', e.message);
    return { code: -1, msg: e.message };
  }
};
