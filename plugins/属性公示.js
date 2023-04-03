// ==UserScript==
// @name         属性公示
// @author       简律纯
// @version      1.0.4
// @description  .d atk <属性值>//录入攻击属性\n.d def <属性值>//录入防御属性\n.d wit <属性值>//录入防御属性\n.d show //[权限]公开属性\n.d clear //[权限]清空属性列表
// 2023-04-03
// @license      by-nc-sa 4.0
// @homepageURL  https://sealdice.civilian.jyunko.cn
// ==/UserScript==
let ext = seal.ext.find('adw');
if (!ext) {
    ext = seal.ext.new('adw', '简律纯', '1.0.4');
    seal.ext.register(ext);
}

// 在模块顶部定义 data 变量
let data = {
    atk: {},
    def: {},
    wit: {}
};

const adw = seal.ext.newCmdItemInfo();
adw.name = 'adw';
adw.help = '.d atk <属性值>//录入攻击属性\n.d def <属性值>//录入防御属性\n.d wit <属性值>//录入防御属性\n.d show //[权限]公开属性\n.d clear //[权限]清空属性列表';
adw.solve = (ctx, msg, cmdArgs) => {
    const match = msg.message.trim().split(/\s+/)
    const type = match[1]; // 指令类型
    const value = parseInt(match[2]); // 数据值
    if (value !== value) {
        switch (type) {
            case 'show':
                if (ctx.privilegeLevel >= 40) {
                    let output = '攻击\n';
                    for (const [name, value] of Object.entries(data.atk)) {
                        output += `<${name}>: ${value}\n`;
                    }

                    output += '\n防御\n';
                    for (const [name, value] of Object.entries(data.def)) {
                        output += `<${name}>: ${value}\n`;
                    }

                    output += '\n见证\n';
                    for (const [name, value] of Object.entries(data.wit)) {
                        output += `<${name}>: ${value}\n`;
                    }


                    seal.replyToSender(ctx, msg, `${output}`);// 发送到主群
                    return seal.ext.newCmdExecuteResult(true);
                } else {
                    seal.replyToSender(ctx, msg, `你不是我的Master!`);
                    return seal.ext.newCmdExecuteResult(true);
                }
            case 'clear':
                if (ctx.privilegeLevel >= 40) {
                    data.atk = {};
                    data.def = {};
                    data.wit = {};
                    seal.replyToSender(ctx, msg, `已清空√`);
                    return seal.ext.newCmdExecuteResult(true);
                } else {
                    seal.replyToSender(ctx, msg, `你不是我的Master!`);
                    return seal.ext.newCmdExecuteResult(true);
                }
            default:
                seal.replyToSender(ctx, msg, adw.help);
        }
    } else {
        switch (type) {
            case 'atk':
                data[type][`${msg.sender.nickname}`] = value; // 保存数据
                seal.replyToSender(ctx, msg, `已录入攻击值√`);
                break;
            case 'def':
                data[type][`${msg.sender.nickname}`] = value; // 保存数据
                seal.replyToSender(ctx, msg, `已录入防御值√`);
                break;
            case 'wit':
                data[type][`${msg.sender.nickname}`] = value; // 保存数据
                seal.replyToSender(ctx, msg, `已录入见证值√`);
                break;
            default:
                seal.replyToSender(ctx, msg, adw.help);
        }
    }
}
// 将指令添加到命令映射中
ext.cmdMap['d'] = adw;
