// ==UserScript==
// @name         后日谈规则
// @author       简律纯
// @version      2.0.4
// @description  两个后日谈规则【.rnc】与【.rna】,帮助命令【.rnc help】与【.rna help】
// 2023-03-27
// @license      by-nc-sa 4.0
// @homepageURL  https://github.com/HsiangNianian/sealdice
// ==/UserScript==

let ext = seal.ext.find('Rsp');
if (!ext) {
  ext = seal.ext.new('Rsp', '简律纯', '2.0.4');
  seal.ext.register(ext);
}

const rnc = seal.ext.newCmdItemInfo();
rnc.name = 'rnc';
rnc.help = '后日谈规则\n.rnc(+-)[修正] //.rnc+3';
rnc.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      let pos = 5;
      let modify = msg.message.match(/[+-]?(\d+)/); // "^[%s]*([+-][%d]+)[%s]*$",4)    
      let addvalue = 0;
      let sign = "";
      if (modify != null) {
        sign = modify[0].substring(0, 1);
        modify = parseFloat(modify[0].substring(1));
        addvalue = parseInt(modify);
        if (sign == '-') {
          addvalue *= -1;
        }
      } else {
        modify = "";
      }
      pos += modify.length;
      let skill = msg.message.match("^[%s\\d]*(.-)[%s\\d]*$", pos.toString());
      if (skill != null) {
        pos += skill.length;
      }
      let res = Math.floor(Math.random() * 10) + 1;
      let strReply = "进行攻击判定:D10" + sign + modify + "=" + res.toString() + sign + modify;
      let final = res + addvalue;
      if (addvalue != 0) {
        strReply += "=" + final.toString();
      }
      if (final <= 1) {
        strReply += " 大失败！";
      } else if (final <= 5) {
        strReply += " 失败";
      } else if (final <= 6) {
        strReply += " 命中自选部位";
      } else if (final <= 7) {
        strReply += " 命中足部";
      } else if (final <= 8) {
        strReply += " 命中躯干";
      } else if (final <= 9) {
        strReply += " 命中手臂";
      } else if (final <= 10) {
        strReply += " 命中头部";
      } else {
        strReply += " 大成功！";
      }
      seal.replyToSender(ctx, msg, `<${msg.sender.nickname}>${strReply}`);
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
ext.cmdMap['rnc'] = rnc;



const rna = seal.ext.newCmdItemInfo();
rna.name = 'rna';
rna.help = '后日谈规则\n.rna<表达式> //.rna3d4+3';
rna.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      const rollDice = (n = 1, d = 10, mod = 0) => {
        const _rolls_ = Array.from({ length: n }, () => Math.ceil(Math.random() * d));
        const rolls = _rolls_.map((roll) => roll + mod);
        const maxRoll = Math.max(...rolls);
        let result;
        //单骰
        if (n === 1) {
          if (maxRoll <= 1) {
            //(-∞,1]) 
            result = "大失败!";
          } else if (maxRoll >= 2 && maxRoll <= 5) {
            //[2,5]
            result = "失败";
          } else if (maxRoll >= 6 && maxRoll <= 10) {
            //[6,9]
            result = "成功"
          } else if (maxRoll >= 11) {
            //[11,+∞]
            result = "大成功!"
          }
        }
        //多骰
        if (n !== 1) {
          if (rolls.every((roll) => roll < 6) && (rolls.includes(1) || rolls.some((roll) => roll < 1))) {
            //(-∞,6) U {1}
            result = "大失败!";
          }
          else if (maxRoll >= 11) {
            //[11,+∞]
            result = "大成功!";
          }
          else if (maxRoll >= 6 && maxRoll <= 10) {
            //[6,10]
            result = "成功";
          } else if (maxRoll > 1 && maxRoll < 6) { 
            //(-∞,1) U (1,6)
            result = "失败";
          }
        }
        const finalResult = maxRoll;
        return `${n}D${d}${mod > 0 ? `+${mod}` : mod < 0 ? mod : ""}=[${_rolls_.join(",")}]${mod !== 0 ? mod > 0 ? `+${mod}` : mod < 0 ? mod : "" : ""}${n > 1 && mod !== 0 ? `=[${rolls.join(",")}]` : ""}=${finalResult} ${result}`;
      };

      let modify = msg.message.match(/[+-](\d+)/);
      let addvalue = 0;
      let sign = "";
      if (modify != null) {
        sign = modify[0].substring(0, 1);
        modify = parseFloat(modify[0].substring(1));
        addvalue = parseInt(modify);
        if (sign == '-') {
          addvalue *= -1;
        }
      } else {
        modify = "";
      }
      let matches2 = msg.message.match(/^\.rna(\d+)/i);
      let numDice = matches2 ? parseInt(matches2[1]) : 1;
      let sides = msg.message.match(/[dD](\d+)[+-]?/i);
      if (sides == null) {
        sides = 10
      } else {
        sides = sides[1]
      }
      seal.replyToSender(ctx, msg, `<${msg.sender.nickname}>进行检定:${rollDice(numDice, sides, addvalue)}`)
    }
  }
}
ext.cmdMap['rna'] = rna;