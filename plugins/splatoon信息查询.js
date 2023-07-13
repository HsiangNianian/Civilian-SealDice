// ==UserScript==
// @name         splatoon信息查询
// @author       地窖上的松,Mouwoo
// @version      1.3.1
// @description  splatoon
// @timestamp    1689234266
// @license      by-nc-sa 4.0
// @homepageURL  https://github.com/sealdice/javascript
// ==/UserScript==
if (!seal.ext.find("splatoon")) {
  const ext = seal.ext.new("splatoon", "地窖上的松,Mouwoo", "1.3.1");
  const cmdSplatoon = seal.ext.newCmdItemInfo();
  cmdSplatoon.name = "splatoon信息查询";
  cmdSplatoon.help = "发送 .splt 查看帮助";
  cmdSplatoon.solve = (ctx, msg, cmdArgs) => {
    let arg = cmdArgs.getArgN(1);
    let arg2 = cmdArgs.getArgN(2);

    // 发送 GET 请求
    fetch("https://splatoon3.ink/data/schedules.json")
      .then((response) => {
        // 判断响应状态码是否为 200
        if (response.ok) {
          return response.text();
        } else {
          console.log(response.status);
          console.log("api失效！");
        }
      })
      //获取数据
      .then((data) => {
        //数据处理
        let spltData = JSON.parse(data);
        let regular_data = spltData["data"]["regularSchedules"]["nodes"]; // 一般比赛
        let bankara_data = spltData["data"]["bankaraSchedules"]["nodes"]; // 蛮颓
        let xgame_data = spltData["data"]["xSchedules"]["nodes"]; // x
        let coop_data =
          spltData["data"]["coopGroupingSchedule"]["regularSchedules"]["nodes"]; // 鲑鱼跑
        let fest_data = spltData["data"]["festSchedules"]["nodes"]; // 祭典

        let translate_data = translate_init();

        // 获取当前时间戳，精确到秒
        // 数据时间为UTC
        let Time = new Date();
        let time = Time.getTime() / 1000 - 28800;
        // 指令处理
        switch (arg) {
          //发送帮助信息
          case "help": {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            break;
          }
          // 查看当前时段地图
          // 加arg2值查看指定时段后地图，单位为小时
          case "map": {
            // 处理偏置，即查询其他时段
            if (arg2 >= 0 && arg2 <= 23) {
              time = time + arg2 * 3600;
            } else if (arg2 >= 24) {
              seal.replyToSender(
                ctx,
                msg,
                "暂不支持查询目标数据。可用参数：0~23"
              );
              break;
            } else {
              seal.replyToSender(ctx, msg, "无效参数。可用参数：0~23");
              break;
            }

            // 取对应时间对应模式的地图数据
            let regular = get_map_data("regular", time);
            let bankara_c = get_map_data("bankara_c", time);
            let bankara_o = get_map_data("bankara_o", time);
            let xgame = get_map_data("xgame", time);

            //合成回执
            seal.replyToSender(ctx, msg, get_result("regular", regular));
            for (i = 1; i < 5000000; i++) {}
            seal.replyToSender(ctx, msg, get_result("bankara_c", bankara_c));
            for (i = 1; i < 5000000; i++) {}
            seal.replyToSender(ctx, msg, get_result("bankara_o", bankara_o));
            for (i = 1; i < 5000000; i++) {}
            seal.replyToSender(ctx, msg, get_result("xgame", xgame));
            break;
          }
          // 获取某一模式当前、下次、下下次的地图列表
          case "td":
          case "yb":
          case "zd": {
            let data0 = get_map_data_list("regular", time);
            let data1 = get_map_data_list("regular", time + 7200);
            let data2 = get_map_data_list("regular", time + 14400);
            seal.replyToSender(
              ctx,
              msg,
              get_result_list("regular", data0, data1, data2)
            );
            break;
          }
          case "mtc":
          case "mtt": {
            let data0 = get_map_data_list("bankara_c", time);
            let data1 = get_map_data_list("bankara_c", time + 7200);
            let data2 = get_map_data_list("bankara_c", time + 14400);
            seal.replyToSender(
              ctx,
              msg,
              get_result_list("bankara_c", data0, data1, data2)
            );
            break;
          }
          case "mto":
          case "mtk": {
            let data0 = get_map_data_list("bankara_o", time);
            let data1 = get_map_data_list("bankara_o", time + 7200);
            let data2 = get_map_data_list("bankara_o", time + 14400);
            seal.replyToSender(
              ctx,
              msg,
              get_result_list("bankara_o", data0, data1, data2)
            );
            break;
          }
          case "X":
          case "x": {
            let data0 = get_map_data_list("xgame", time);
            let data1 = get_map_data_list("xgame", time + 7200);
            let data2 = get_map_data_list("xgame", time + 14400);
            seal.replyToSender(
              ctx,
              msg,
              get_result_list("xgame", data0, data1, data2)
            );
            break;
          }

          // 鲑鱼跑
          case "work": {
            let data1 = get_work_data(time);
            let data2 = get_work_data(time + 144000);

            seal.replyToSender(ctx, msg, "当前时段鲑鱼跑：");
            seal.replyToSender(ctx, msg, get_work_result(data1));
            //如果距离下一次地图更新不到12小时，则将下一时段的地图一起回复
            for (i = 1; i < 5000000; i++) {}
            if (time + 28800 > data1["e_timestamp"] - 43200)
              seal.replyToSender(ctx, msg, "下一时段鲑鱼跑：");
            seal.replyToSender(ctx, msg, get_work_result(data2));
            break;
          }

          // 获取今日精选
          case "shop": {
            let url = "https://splatoon3.ink/data/gear.json";
            let promise = fetch(url).then(function (response) {
              if (response.status === 200) {
                return response.json();
              } else {
                return {};
              }
            });
            promise = promise
              .then(function (data) {
                let shopdata = get_shop_data(data);
                seal.replyToSender(ctx, msg, get_shop_result(shopdata));
              })
              .catch(function (error) {
                console.log("api请求错误！错误原因：" + error);
              });
            break;
          }

          // 空参返回指令帮助
          default: {
            seal.replyToSender(
              ctx,
              msg,
              "Splatoon3地图轮换查询v1.3.1\n\n.splt map [参数]\n查询当前时间经过[参数]小时后的地图，[参数]为空查询当前地图。\n.splt work\n查询当前时间鲑鱼跑地图，如果距离下一次地图更新不到12小时则会附带下个时段地图数据\n.splt yb/td/zd\n查询一般模式地图轮换(当前、下次、下下次)。\n.splt mtt/mtc\n查询蛮颓模式-挑战地图轮换(当前、下次、下下次)。\n.splt mtk/mto\n查询蛮颓模式-开放地图轮换(当前、下次、下下次)。\n.splt x\n查询X比赛地图轮换(当前、下次、下下次)。\n.splt shop\n查询鱿鱼须商城今日精选。\n\n#数据来源：splatoon3.ink"
            );
          }
        }

        // 时间戳转换为年-月-日 时:分
        function take_date(timestamp) {
          let date = new Date(timestamp * 1000);
          Y = date.getFullYear() + "-";
          M =
            (date.getMonth() + 1 < 10
              ? "0" + (date.getMonth() + 1)
              : date.getMonth() + 1) + "-";
          D =
            (date.getDate() < 10 ? "0" + date.getDate() : date.getDate()) + " ";
          h =
            (date.getHours() < 10 ? "0" + date.getHours() : date.getHours()) +
            ":";
          m =
            date.getMinutes() < 10
              ? "0" + date.getMinutes()
              : date.getMinutes();
          return Y + M + D + h + m;
        }
        // json中时间转换为时间戳，单位秒
        function take_timestamp(json_time) {
          let json_date = String(json_time.slice(0, 10));
          let json_hour = String(json_time.slice(11, 19));
          let json_timestamp =
            new Date(json_date + " " + json_hour).getTime() / 1000;
          return json_timestamp;
        }

        // 根据时间取相应模式相应时间段的地图数据
        function get_map_data(mode, get_timestamp) {
          let data = {};
          data.map1 = {};
          data.map2 = {};
          switch (mode) {
            case "regular": {
              for (v of regular_data) {
                // 时间处理
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);

                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.regularMatchSetting.vsRule["rule"];
                  data["map1"]["id"] =
                    v["regularMatchSetting"]["vsStages"][0]["id"];
                  data["map1"]["img"] =
                    v["regularMatchSetting"]["vsStages"][0]["image"]["url"];
                  data["map2"]["id"] =
                    v["regularMatchSetting"]["vsStages"][1]["id"];
                  data["map2"]["img"] =
                    v["regularMatchSetting"]["vsStages"][1]["image"]["url"];
                  data = map_translate(data);
                  return data;
                }
              }
            }

            case "bankara_c": {
              for (v of bankara_data) {
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);

                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.bankaraMatchSettings[0]["vsRule"]["rule"];
                  data["map1"]["id"] =
                    v["bankaraMatchSettings"][0]["vsStages"][0]["id"];
                  data["map1"]["img"] =
                    v["bankaraMatchSettings"][0]["vsStages"][0]["image"]["url"];
                  data["map2"]["id"] =
                    v["bankaraMatchSettings"][0]["vsStages"][1]["id"];
                  data["map2"]["img"] =
                    v["bankaraMatchSettings"][0]["vsStages"][1]["image"]["url"];
                  data = map_translate(data);
                  return data;
                }
              }
            }

            case "bankara_o": {
              for (v of bankara_data) {
                // 时间处理
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);

                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.bankaraMatchSettings[1]["vsRule"]["rule"];
                  data["map1"]["id"] =
                    v["bankaraMatchSettings"][1]["vsStages"][0]["id"];
                  data["map1"]["img"] =
                    v["bankaraMatchSettings"][1]["vsStages"][0]["image"]["url"];
                  data["map2"]["id"] =
                    v["bankaraMatchSettings"][1]["vsStages"][1]["id"];
                  data["map2"]["img"] =
                    v["bankaraMatchSettings"][1]["vsStages"][1]["image"]["url"];
                  data = map_translate(data);
                  return data;
                }
              }
            }

            case "xgame": {
              for (v of xgame_data) {
                // 时间处理
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);

                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.xMatchSetting["vsRule"]["rule"];
                  data["map1"]["id"] = v["xMatchSetting"]["vsStages"][0]["id"];
                  data["map1"]["img"] =
                    v["xMatchSetting"]["vsStages"][0]["image"]["url"];
                  data["map2"]["id"] = v["xMatchSetting"]["vsStages"][1]["id"];
                  data["map2"]["img"] =
                    v["xMatchSetting"]["vsStages"][1]["image"]["url"];
                  data = map_translate(data);
                  return data;
                }
              }
            }
          }
        }
        function get_map_data_list(mode, get_timestamp) {
          let data = {};
          data.map1 = {};
          data.map2 = {};
          switch (mode) {
            case "regular": {
              for (v of regular_data) {
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);
                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.regularMatchSetting.vsRule["rule"];
                  data["map1"]["name"] =
                    v["regularMatchSetting"]["vsStages"][0]["name"];
                  data["map1"]["id"] =
                    v["regularMatchSetting"]["vsStages"][0]["id"];
                  data["map2"]["name"] =
                    v["regularMatchSetting"]["vsStages"][1]["name"];
                  data["map2"]["id"] =
                    v["regularMatchSetting"]["vsStages"][1]["id"];
                  data = map_translate(data);
                  return data;
                }
              }
              break;
            }
            case "bankara_c": {
              for (v of bankara_data) {
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);
                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.bankaraMatchSettings[0]["vsRule"]["rule"];
                  data["map1"]["name"] =
                    v["bankaraMatchSettings"][0]["vsStages"][0]["name"];
                  data["map2"]["name"] =
                    v["bankaraMatchSettings"][0]["vsStages"][1]["name"];
                  data["map1"]["id"] =
                    v["bankaraMatchSettings"][0]["vsStages"][0]["id"];
                  data["map2"]["id"] =
                    v["bankaraMatchSettings"][0]["vsStages"][1]["id"];
                  data = map_translate(data);
                  return data;
                }
              }
              break;
            }
            case "bankara_o": {
              for (v of bankara_data) {
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);
                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.bankaraMatchSettings[1]["vsRule"]["rule"];
                  data["map1"]["name"] =
                    v["bankaraMatchSettings"][1]["vsStages"][0]["name"];
                  data["map2"]["name"] =
                    v["bankaraMatchSettings"][1]["vsStages"][1]["name"];
                  data["map1"]["id"] =
                    v["bankaraMatchSettings"][1]["vsStages"][0]["id"];
                  data["map2"]["id"] =
                    v["bankaraMatchSettings"][1]["vsStages"][1]["id"];
                  data = map_translate(data);
                  return data;
                }
              }
              break;
            }
            case "xgame": {
              for (v of xgame_data) {
                let s_timestamp = take_timestamp(v["startTime"]);
                let e_timestamp = take_timestamp(v["endTime"]);
                if (
                  get_timestamp >= s_timestamp &&
                  get_timestamp < e_timestamp
                ) {
                  data["start_time"] = take_date(s_timestamp + 28800);
                  data["end_time"] = take_date(e_timestamp + 28800);
                  data["mode"] = v.xMatchSetting["vsRule"]["rule"];
                  data["map1"]["name"] =
                    v["xMatchSetting"]["vsStages"][0]["name"];
                  data["map2"]["name"] =
                    v["xMatchSetting"]["vsStages"][1]["name"];
                  data["map1"]["id"] = v["xMatchSetting"]["vsStages"][0]["id"];
                  data["map2"]["id"] = v["xMatchSetting"]["vsStages"][1]["id"];
                  data = map_translate(data);
                  return data;
                }
              }
              break;
            }
          }
          return data;
        }

        // 取鲑鱼跑模式数据，会顺便返回结束时间戳
        function get_work_data(get_timestamp) {
          let data = {};
          data.map = {};
          data.weapons = [{}, {}, {}, {}];
          for (v of coop_data) {
            let s_timestamp = take_timestamp(v["startTime"]);
            let e_timestamp = take_timestamp(v["endTime"]);
            if (get_timestamp >= s_timestamp && get_timestamp < e_timestamp) {
              data["start_time"] = take_date(s_timestamp + 28800);
              data["end_time"] = take_date(e_timestamp + 28800);
              data["map"]["name"] = v["setting"]["coopStage"]["name"];
              data["map"]["img"] = v["setting"]["coopStage"]["image"]["url"];
              data["map"]["id"] = v["setting"]["coopStage"]["id"];
              for (let i = 0; i < 4; i++) {
                data["weapons"][i]["name"] = v["setting"]["weapons"][i]["name"];
                data["weapons"][i]["url"] =
                  v["setting"]["weapons"][i]["image"]["url"];
                data["weapons"][i]["id"] =
                  v["setting"]["weapons"][i]["__splatoon3ink_id"];
              }
              data["boss"] = v["__splatoon3ink_king_salmonid_guess"];
              data["e_timestamp"] = e_timestamp + 28800;
              data = work_translate(data);
              return data;
            }
          }
          return "找不到相关时间段鲑鱼跑数据";
        }
        
        // 商店今日精选数据
        function get_shop_data(shopData) {
          let shopdata = {};
          shopdata.gear1 = {};
          shopdata.gear2 = {};
          shopdata.gear3 = {};
          shopdata["endtime"] = take_date(
            take_timestamp(
              shopData["data"]["gesotown"]["pickupBrand"]["saleEndTime"]
            ) + 28800
          );
          shopdata["brand"] = translate(
            "brands",
            shopData["data"]["gesotown"]["pickupBrand"]["brand"]["id"]
          );
          shopdata["usualpower"] = translate(
            "powers",
            shopData["data"]["gesotown"]["pickupBrand"]["brand"][
              "usualGearPower"
            ]["__splatoon3ink_id"]
          );
          shopdata.gear1["name"] = translate(
            "gear",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][0][
              "gear"
            ]["__splatoon3ink_id"]
          );
          shopdata.gear1["image"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][0][
              "gear"
            ]["image"]["url"];
          shopdata.gear1["price"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][0][
              "price"
            ];
          shopdata.gear1["power"] = translate(
            "powers",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][0][
              "gear"
            ]["primaryGearPower"]["__splatoon3ink_id"]
          );
          shopdata.gear1["power_num"] = Object.keys(
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][0]["gear"]
              .additionalGearPowers
          ).length;

          shopdata.gear2["name"] = translate(
            "gear",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][1][
              "gear"
            ]["__splatoon3ink_id"]
          );
          shopdata.gear2["image"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][1][
              "gear"
            ]["image"]["url"];
          shopdata.gear2["price"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][1][
              "price"
            ];
          shopdata.gear2["power"] = translate(
            "powers",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][1][
              "gear"
            ]["primaryGearPower"]["__splatoon3ink_id"]
          );
          shopdata.gear2["power_num"] = Object.keys(
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][1]["gear"]
              .additionalGearPowers
          ).length;

          shopdata.gear3["name"] = translate(
            "gear",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][2][
              "gear"
            ]["__splatoon3ink_id"]
          );
          shopdata.gear3["image"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][2][
              "gear"
            ]["image"]["url"];
          shopdata.gear3["price"] =
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][2][
              "price"
            ];
          shopdata.gear3["power"] = translate(
            "powers",
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][2][
              "gear"
            ]["primaryGearPower"]["__splatoon3ink_id"]
          );
          shopdata.gear3["power_num"] = Object.keys(
            shopData["data"]["gesotown"]["pickupBrand"]["brandGears"][2]["gear"]
              .additionalGearPowers
          ).length;
          return shopdata;
        }

        // 从某一份地图数据中取出数据合成字符串，字符串以\n开头
        function get_result(mode, data) {
          let mode_name = "";
          let result;
          switch (mode) {
            case "regular": {
              mode_name = "一般模式";
              break;
            }
            case "bankara_c": {
              mode_name = "蛮颓模式-挑战";
              break;
            }
            case "bankara_o": {
              mode_name = "蛮颓模式-开放";
              break;
            }
            case "xgame": {
              mode_name = "X模式";
              break;
            }
          }
          result =
            "\n" +
            mode_name +
            "-" +
            data["mode"] +
            "\n" +
            "开始时间" +
            data["start_time"] +
            "\n" +
            "结束时间" +
            data["end_time"] +
            "\n" +
            data["map1"]["name"] +
            " " +
            data["map2"]["name"] +
            "\n" +
            "[CQ:image,file=" +
            data["map1"]["img"] +
            "]" +
            "[CQ:image,file=" +
            data["map2"]["img"] +
            "]\n";
          return result;
        }

        // 合成list字符串，以\n开头
        function get_result_list(mode, data0, data1, data2) {
          let mode_name = "";
          let result;
          let result0;
          let result1;
          let result2;
          switch (mode) {
            case "regular": {
              mode_name = "一般模式";
              break;
            }
            case "bankara_c": {
              mode_name = "蛮颓模式-挑战";
              break;
            }
            case "bankara_o": {
              mode_name = "蛮颓模式-开放";
              break;
            }
            case "xgame": {
              mode_name = "X模式";
              break;
            }
          }
          if (data0["start_time"] == null) {
            result0 = "数据获取失败。";
          } else {
            result0 =
              "开始时间" +
              data0["start_time"] +
              "\n" +
              "结束时间" +
              data0["end_time"] +
              "\n" +
              data0["mode"] +
              "\n" +
              data0["map1"]["name"] +
              " " +
              data0["map2"]["name"];
          }
          if (data1["start_time"] == null) {
            result1 = "数据获取失败。";
          } else {
            result1 =
              "开始时间" +
              data1["start_time"] +
              "\n" +
              "结束时间" +
              data1["end_time"] +
              "\n" +
              data1["mode"] +
              "\n" +
              data1["map1"]["name"] +
              " " +
              data1["map2"]["name"];
          }
          if (data2["start_time"] == null) {
            result2 = "数据获取失败。";
          } else {
            result2 =
              "开始时间" +
              data2["start_time"] +
              "\n" +
              "结束时间" +
              data2["end_time"] +
              "\n" +
              data2["mode"] +
              "\n" +
              data2["map1"]["name"] +
              " " +
              data2["map2"]["name"];
          }
          result =
            "\n----" +
            mode_name +
            "----\n" +
            "当前：" +
            "\n" +
            result0 +
            "\n\n" +
            "下次：" +
            "\n" +
            result1 +
            "\n\n" +
            "下下次：" +
            "\n" +
            result2 +
            "\n";
          return result;
        }

        // 合成鲑鱼跑字符串，以\n开头
        function get_work_result(data) {
          result =
            "\n" +
            "开始时间" +
            data["start_time"] +
            "\n" +
            "结束时间" +
            data["end_time"] +
            "\n地图：" +
            data["map"]["name"] +
            "\n" +
            "[CQ:image,file=" +
            data["map"]["img"] +
            "]\n头目鲑鱼：" +
            data["boss"] +
            "\n" +
            "发放武器：" +
            data["weapons"][0]["name"] +
            "\n[CQ:image,file=" +
            data["weapons"][0]["url"] +
            "]\n" +
            data["weapons"][1]["name"] +
            "\n[CQ:image,file=" +
            data["weapons"][1]["url"] +
            "]\n" +
            data["weapons"][2]["name"] +
            "\n[CQ:image,file=" +
            data["weapons"][2]["url"] +
            "]\n" +
            data["weapons"][3]["name"] +
            "\n[CQ:image,file=" +
            data["weapons"][3]["url"] +
            "]";
          return result;
        }

        // 合成商店字符串
        function get_shop_result(data) {
          result =
            "\n" +
            "鱿鱼须商城今日精选[" +
            data["brand"] +
            "]\n" +
            "结束时间：" +
            data["endtime"] +
            "\n" +
            "容易附加于[" +
            data["brand"] +
            "]的装备能力：" +
            data["usualpower"] +
            "[CQ:image,file=" +
            data.gear1["image"] +
            "]\n" +
            data.gear1["name"] +
            "  " +
            data.gear1["price"] +
            "\n" +
            data.gear1["power"] +
            "\n基本能力槽数：" +
            data.gear1["power_num"] +
            "[CQ:image,file=" +
            data.gear2["image"] +
            "]\n" +
            data.gear2["name"] +
            "  " +
            data.gear2["price"] +
            "\n" +
            data.gear2["power"] +
            "\n基本能力槽数：" +
            data.gear2["power_num"] +
            "[CQ:image,file=" +
            data.gear3["image"] +
            "]\n" +
            data.gear3["name"] +
            "  " +
            data.gear3["price"] +
            "\n" +
            data.gear3["power"] +
            "\n基本能力槽数：" +
            data.gear3["power_num"];
          return result;
        }

        // 鲑鱼跑数据翻译
        function work_translate(data) {
          console.log(data["map"]["id"]);
          data["map"]["name"] = translate("stages", data["map"]["id"]);
          if (data["boss"] == "Cohozuna") data["boss"] = "横纲";
          else data["boss"] = "辰龙";
          for (i = 0; i < 4; i++)
            data["weapons"][i]["name"] = translate(
              "weapons",
              data["weapons"][i]["id"]
            );
          return data;
        }

        // 对战地图翻译
        function map_translate(data) {
          data["map1"]["name"] = translate("stages", data["map1"]["id"]);
          data["map2"]["name"] = translate("stages", data["map2"]["id"]);
          return data;
        }
        // 单个翻译，type可选参数：stages/地图、rules/规则、weapons/武器、brands/品牌、gear/商品、powers/BUFF、festivals/节日三选一和events/特殊事件
        function translate(type, id) {
          for (v in translate_data[type])
            if (id == v) return translate_data[type][v]["name"];
          return "找不到翻译数据";
        }
      })
      .catch((error) => {
        console.log("api请求错误！错误原因：" + error);
      });

    // 翻译数据并不需要实时更新，那么不如直接内置   ~~以后有更新再说~~
    function translate_init() {
      let translate_data = `{
  "stages": {
    "VnNTdGFnZS0x": {
      "name": "温泉花大峡谷"
    },
    "VnNTdGFnZS0y": {
      "name": "鳗鲶区"
    },
    "VnNTdGFnZS0z": {
      "name": "烟管鱼市场"
    },
    "VnNTdGFnZS00": {
      "name": "竹蛏疏洪道"
    },
    "VnNTdGFnZS02": {
      "name": "鱼肉碎金属"
    },
    "VnNTdGFnZS0xMA==": {
      "name": "真鲭跨海大桥"
    },
    "VnNTdGFnZS0xMQ==": {
      "name": "金眼鲷美术馆"
    },
    "VnNTdGFnZS0xMg==": {
      "name": "鬼头刀SPA度假区"
    },
    "VnNTdGFnZS0xMw==": {
      "name": "海女美术大学"
    },
    "VnNTdGFnZS0xNA==": {
      "name": "鲟鱼造船厂"
    },
    "VnNTdGFnZS0xNQ==": {
      "name": "座头购物中心"
    },
    "VnNTdGFnZS0xNg==": {
      "name": "醋饭海洋世界"
    },
    "Q29vcFN0YWdlLTc=": {
      "name": "麦年海洋发电所"
    },
    "Q29vcFN0YWdlLTE=": {
      "name": "鲑坝"
    },
    "Q29vcFN0YWdlLTI=": {
      "name": "新卷堡"
    },
    "Q29vcFN0YWdlLTY=": {
      "name": "漂浮落难船"
    },
    "VnNTdGFnZS03": {
      "name": "臭鱼干温泉"
    },
    "VnNTdGFnZS05": {
      "name": "比目鱼住宅区"
    },
    "Q29vcFN0YWdlLTEwMA==": {
      "name": "醋饭海洋世界"
    },
    "Q29vcFN0YWdlLS05OTk=": {
      "name": ""
    },
    "VnNTdGFnZS01": {
      "name": "鱼露遗迹"
    },
    "VnNTdGFnZS0xOA==": {
      "name": "鬼蝠鲼玛利亚号"
    },
    "Q29vcFN0YWdlLTEwMg==": {
      "name": "海女美术大学"
    },
    "VnNTdGFnZS04": {
      "name": "塔拉波特购物公园"
    },
    "VnNTdGFnZS0xNw==": {
      "name": "昆布赛道"
    },
    "Q29vcFN0YWdlLTg=": {
      "name": "生筋子系统交流道遗址"
    },
    "Q29vcFN0YWdlLTEwMw==": {
      "name": "竹蛏疏洪道"
    }
  },
  "rules": {
    "VnNSdWxlLTA=": {
      "name": "占地对战"
    },
    "VnNSdWxlLTI=": {
      "name": "真格塔楼"
    },
    "VnNSdWxlLTM=": {
      "name": "真格鱼虎对战"
    },
    "VnNSdWxlLTE=": {
      "name": "真格区域"
    },
    "VnNSdWxlLTQ=": {
      "name": "真格蛤蜊"
    }
  },
  "weapons": {
    "48d6e062dd8b7efb": {
      "name": "专业模型枪MG"
    },
    "3adcc67d997a5aa8": {
      "name": "碳纤维滚筒"
    },
    "61d373353a48eb2e": {
      "name": "爆炸泼桶"
    },
    "cfcd1cb4b09dc134": {
      "name": "喷射清洁枪"
    },
    "7813d8c4d9103b07": {
      "name": "洗笔桶"
    },
    "57684fd4ee281e09": {
      "name": "斯普拉滚筒"
    },
    "7a4705bd110b0cee": {
      "name": "满溢泡澡泼桶"
    },
    "ba2b27f7c17b1632": {
      "name": "三发猎鱼弓"
    },
    "3939e000515fe04c": {
      "name": "四重弹跳手枪 黑"
    },
    "6c5bbce4a6c63d0c": {
      "name": "开瓶喷泉枪"
    },
    "39e383c2f6d1ca3e": {
      "name": "鹦鹉螺号47"
    },
    "627d43fa3ab06066": {
      "name": "快速爆破枪"
    },
    "4dc28c8d9bca2dae": {
      "name": "斯普拉机动枪"
    },
    "670ae6f0c617cca4": {
      "name": "火热爆破枪"
    },
    "9e45d86ccd5fea1e": {
      "name": "圆珠笔"
    },
    "e2b5e6b340555596": {
      "name": "高压油管枪"
    },
    "59d665d32bb4122a": {
      "name": "窄域标记枪"
    },
    "77e4f6414e5a257d": {
      "name": "雨刷刮水刀"
    },
    "2c34cb021254c8f8": {
      "name": "顶尖射击枪"
    },
    "f668bd94e7ebf62d": {
      "name": "快速爆破枪 精英"
    },
    "d3d579406dbc0fc8": {
      "name": "专业模型枪MG"
    },
    "8c157e85b75798e7": {
      "name": "碳纤维滚筒"
    },
    "6529a2c7f83ca858": {
      "name": "爆炸泼桶"
    },
    "92f330252fdd9421": {
      "name": "喷射清洁枪"
    },
    "7d97fc215efe47fa": {
      "name": "洗笔桶"
    },
    "0637f4b4225f22b8": {
      "name": "斯普拉滚筒"
    },
    "13ef7ad9ba855fe1": {
      "name": "满溢泡澡泼桶"
    },
    "7ed9dd50b97d24f3": {
      "name": "三发猎鱼弓"
    },
    "8e59d00fc471083a": {
      "name": "四重弹跳手枪 黑"
    },
    "f09bb1bb306659dd": {
      "name": "开瓶喷泉枪"
    },
    "af505e7c4bdb7888": {
      "name": "鹦鹉螺号47"
    },
    "2d3900d357e005e9": {
      "name": "快速爆破枪"
    },
    "582d03e42a63596a": {
      "name": "斯普拉机动枪"
    },
    "9208eee9ecd2026e": {
      "name": "火热爆破枪"
    },
    "cb9126ea2928b619": {
      "name": "圆珠笔"
    },
    "70aa6b216ca8f01c": {
      "name": "高压油管枪"
    },
    "41492e011c163cc1": {
      "name": "窄域标记枪"
    },
    "df5b39ea3d32b25b": {
      "name": "雨刷刮水刀"
    },
    "617dedf1c26235dc": {
      "name": "顶尖射击枪"
    },
    "83275e416e7c1bc2": {
      "name": "快速爆破枪 精英"
    },
    "1f6ce9f852641707": {
      "name": "随机"
    },
    "d9bbd083353c118d": {
      "name": ".52加仑"
    },
    "9a9dcaa55c2f6545": {
      "name": "斯普拉射击枪"
    },
    "8c0617eafedab081": {
      "name": "14式竹筒枪·甲"
    },
    "0037f260dd45e397": {
      "name": "露营防空伞"
    },
    "cf6021b669c84379": {
      "name": "N-ZAP85"
    },
    "b5c29680486b0d1c": {
      "name": "巴勃罗"
    },
    "a99a6dd8efd4d5bb": {
      "name": "H3卷管枪"
    },
    "50563f3849b68e0a": {
      "name": "消防栓旋转枪"
    },
    "1e344559d62809b2": {
      "name": "溅镀枪"
    },
    "e594a5f9535eaf40": {
      "name": "北斋"
    },
    "7a2dd4e35809d537": {
      "name": "电动马达滚筒"
    },
    "1e9e39f56c9f6d1a": {
      "name": "鱿快洁α"
    },
    "5903a8cef02e4298": {
      "name": "开尔文525"
    },
    "1208a614c4bb22cf": {
      "name": "冲涂爆破枪"
    },
    "cb1243d9c1908a38": {
      "name": "斯普拉旋转枪"
    },
    "57717b83b81f474f": {
      "name": "公升4K"
    },
    "e70b1ea70b5916be": {
      "name": "广域标记枪"
    },
    "4b6949b9e979636c": {
      "name": "新星爆破枪"
    },
    "53cefbb18bb74cb3": {
      "name": "特工配件"
    },
    "1d1dd4a9165c4a0c": {
      "name": "斯普拉蓄力狙击枪"
    },
    "97745a7307013de3": {
      "name": "双重清洁枪"
    },
    "11ba9e5928b14318": {
      "name": "桶装旋转枪"
    },
    "5615e681937a3f12": {
      "name": "L3卷管枪"
    },
    "24cab1bbfb443770": {
      "name": "遮阳防空伞"
    },
    "ab50e9ae40810698": {
      "name": ".96加仑"
    },
    "319a3174ebcb8224": {
      "name": "新叶射击枪"
    },
    "a31def86914d98ae": {
      "name": "回旋泼桶"
    },
    "afc40370eb8a1aa5": {
      "name": "远距爆破枪"
    },
    "daa5ab5b571faec5": {
      "name": "可变式滚筒"
    },
    "8f8bfbac8a43c2c7": {
      "name": "工作刮水刀"
    },
    "70e60082b7f73c24": {
      "name": "LACT-450"
    },
    "13d0d18880c2f4e4": {
      "name": "飞溅泼桶"
    },
    "66e9cd75721a942f": {
      "name": "太空射击枪"
    },
    "7f8967b3ae112ffc": {
      "name": "宽滚筒"
    },
    "a1ea7028b1bcdd28": {
      "name": "R-PEN/5H"
    },
    "edcfecb7e8acd1a7": {
      "name": "随机"
    },
    "fdf543c48448da4e": {
      "name": "广域标记枪"
    },
    "20efbeb85f11abdb": {
      "name": "开瓶喷泉枪"
    },
    "b4417b7d33c4ab76": {
      "name": "满溢泡澡泼桶"
    },
    "a7d8fc7be0a046c5": {
      "name": "三发猎鱼弓"
    },
    "b88acfa356b2b714": {
      "name": "特工配件"
    },
    "f17da8de892bcdfe": {
      "name": "N-ZAP85"
    },
    "e11e5913db5eb0c2": {
      "name": "斯普拉滚筒"
    },
    "b481841e5def66d6": {
      "name": "鱿快洁α"
    },
    "6834571f25b34c9b": {
      "name": "巴勃罗"
    },
    "f6c61a0f1a701928": {
      "name": ".52加仑"
    },
    "78795dccc3ffeef2": {
      "name": "爆炸泼桶"
    },
    "585c7915a3dc5f28": {
      "name": "斯普拉蓄力狙击枪"
    },
    "2fc3e19d592734ea": {
      "name": "随机"
    },
    "32982b9043dd8d1e": {
      "name": "LACT-450"
    },
    "09465cbd66e15c68": {
      "name": "斯普拉机动枪"
    },
    "23c3b20f6e9ed6ec": {
      "name": "回旋泼桶"
    },
    "cacef7e261a01e16": {
      "name": "快速爆破枪"
    },
    "7df085c7508e8535": {
      "name": "洗笔桶"
    },
    "61a156e5e66059eb": {
      "name": "太空射击枪"
    },
    "4d532284b062ba27": {
      "name": "电动马达滚筒"
    },
    "1f7f2880bcca7894": {
      "name": ".96加仑"
    },
    "c8cdd727419d9309": {
      "name": "开尔文525"
    },
    "f695f95bfc09af76": {
      "name": "L3卷管枪"
    },
    "c1a8381441bb38a7": {
      "name": "工作刮水刀"
    },
    "91aa1bf7ac84f262": {
      "name": "R-PEN/5H"
    },
    "3a6b429b6f247c59": {
      "name": "雨刷刮水刀"
    },
    "44b6f56d15a02529": {
      "name": "火热爆破枪"
    },
    "6f2cb494a35976ab": {
      "name": "可变式滚筒"
    },
    "70897086ac95fc07": {
      "name": "露营防空伞"
    },
    "49171e6de78e50c7": {
      "name": "新叶射击枪"
    },
    "5d214c667c007340": {
      "name": "顶尖射击枪"
    },
    "d6c4482a8ef368b6": {
      "name": "远距爆破枪"
    },
    "dfa290ce0cdeae98": {
      "name": "公升4K"
    },
    "53054d13f95bfdac": {
      "name": "专业模型枪MG"
    },
    "7529642b716dda2a": {
      "name": "斯普拉旋转枪"
    },
    "6832e7cb1f31ec60": {
      "name": "宽滚筒"
    },
    "8823b314132f4724": {
      "name": "高压油管枪"
    },
    "974ad42eab86aa42": {
      "name": "窄域标记枪"
    },
    "98ce5f188f2896e8": {
      "name": "冲涂爆破枪"
    },
    "ec55cea9d34b4b87": {
      "name": "圆珠笔"
    },
    "b0343d4f4b600e95": {
      "name": "喷射清洁枪"
    },
    "6ca015df6356568c": {
      "name": "斯普拉射击枪"
    },
    "9e5ea39b1890ffe1": {
      "name": "飞溅泼桶"
    },
    "efb18bcc3e8d0faa": {
      "name": "14式竹筒枪·甲"
    },
    "8afbd08cdbde979e": {
      "name": "碳纤维滚筒"
    },
    "a6524fda305001c3": {
      "name": "双重清洁枪"
    },
    "3870511200d2f54e": {
      "name": "快速爆破枪 精英"
    },
    "7b1ca52db7863e83": {
      "name": "北斋"
    },
    "488255e9a515eeb2": {
      "name": "H3卷管枪"
    },
    "de0a10dff827d3fd": {
      "name": "桶装旋转枪"
    },
    "9ec907326e0a0fbb": {
      "name": "新星爆破枪"
    },
    "970da796325a8adb": {
      "name": "遮阳防空伞"
    },
    "20ac9088101d14aa": {
      "name": "溅镀枪"
    },
    "aae42b6ef1b5090d": {
      "name": "消防栓旋转枪"
    },
    "3feb54ef838cb9e2": {
      "name": "四重弹跳手枪 黑"
    },
    "fec6f764a77ec60e": {
      "name": "鹦鹉螺号47"
    },
    "6e17fbe20efecca9": {
      "name": "随机"
    },
    "d194e691a458ad5f": {
      "name": "问号"
    },
    "ae62156873b8c5e5": {
      "name": "S-BLAST92"
    },
    "4ae1bd005e4c7d9c": {
      "name": "文森"
    }
  },
  "brands": {
    "QnJhbmQtOA==": {
      "name": "寺门"
    },
    "QnJhbmQtMTk=": {
      "name": "散寿司"
    },
    "QnJhbmQtMjA=": {
      "name": "七轮"
    },
    "QnJhbmQtMA==": {
      "name": "战斗鱿鱼"
    },
    "QnJhbmQtMw==": {
      "name": "罗肯贝格"
    },
    "QnJhbmQtNA==": {
      "name": "泽酷"
    },
    "QnJhbmQtNQ==": {
      "name": "锻品"
    },
    "QnJhbmQtNg==": {
      "name": "暖流"
    },
    "QnJhbmQtMTE=": {
      "name": "暇古"
    },
    "QnJhbmQtMTA=": {
      "name": "艾洛眼"
    },
    "QnJhbmQtOQ==": {
      "name": "时雨"
    },
    "QnJhbmQtMg==": {
      "name": "海月"
    },
    "QnJhbmQtNw==": {
      "name": "帆立"
    },
    "QnJhbmQtMTc=": {
      "name": "剑尖鱿"
    },
    "QnJhbmQtMQ==": {
      "name": "钢铁先锋"
    },
    "QnJhbmQtMTY=": {
      "name": "鱿皇"
    },
    "QnJhbmQtMTU=": {
      "name": "无法无天"
    },
    "QnJhbmQtOTg=": {
      "name": "鱼干制造"
    }
  },
  "gear": {
    "1f6189fcaf092a8f": {
      "name": "经典圆顶礼帽"
    },
    "81921ab4f3fc42fa": {
      "name": "白色衬衫"
    },
    "8af6d74efc8ee977": {
      "name": "魔鬼毡鞋 红色"
    },
    "e0ef16dcbf779fd8": {
      "name": "基地训练鞋 入门"
    },
    "406929c86d7a258e": {
      "name": "密集水滴鱼上衣 莓果红"
    },
    "3dc58146de458313": {
      "name": "鱿鱼T恤 白色"
    },
    "c2bb9f1294c295da": {
      "name": "越野摩托车靴"
    },
    "43847b716e0167b8": {
      "name": "铁蛋墨镜"
    },
    "71abfaf22d9b6bbe": {
      "name": "骑士偏光眼镜"
    },
    "b53bdaf8c13d29f2": {
      "name": "视野中空遮阳帽"
    },
    "174d4dbb6348257b": {
      "name": "经典圆顶礼帽"
    },
    "ad7271a600e96517": {
      "name": "白色衬衫"
    },
    "24232b34f82cb2d3": {
      "name": "魔鬼毡鞋 红色"
    },
    "b8fd00bc6b0e03f8": {
      "name": "基地训练鞋 入门"
    },
    "aac289491487b78e": {
      "name": "密集水滴鱼上衣 莓果红"
    },
    "42fd0a010e3834d6": {
      "name": "鱿鱼T恤 白色"
    },
    "d6ae0f6877fbe8e7": {
      "name": "越野摩托车靴"
    },
    "2e502b645aa81e2c": {
      "name": "铁蛋墨镜"
    },
    "66b70d0194f48051": {
      "name": "骑士偏光眼镜"
    },
    "2b897acb8435752e": {
      "name": "视野中空遮阳帽"
    },
    "11826a638e557c8c": {
      "name": "海军风横纹T恤"
    },
    "eeea995329a3b65a": {
      "name": "斯普拉护目镜"
    },
    "8c2f59eb75da5ece": {
      "name": "烧河豚丝巾 饼干"
    },
    "5f1f38129dc8708e": {
      "name": "能力重置高筒鞋"
    },
    "b4efce44ed819f22": {
      "name": "再版T恤 棕色"
    },
    "a8037dfb0ea3cfc9": {
      "name": "浮法玻璃透明眼镜"
    },
    "c9b62256129de184": {
      "name": "山岳T恤 象牙色"
    },
    "4402242820b66e9b": {
      "name": "三角带运动凉鞋 雪白"
    },
    "9dda2a64daaa651f": {
      "name": "绣花衬衫 烟管鱼"
    },
    "d4c2c203e5ef0568": {
      "name": "日落渐层T恤"
    },
    "947dcdc899197eb1": {
      "name": "骨传导鳍挂式耳机EP"
    },
    "1bd94af735c58372": {
      "name": "山核桃条纹工作帽"
    },
    "643a053973902353": {
      "name": "立体声录音机耳机"
    },
    "677b0d3b7d27ad00": {
      "name": "01STER 琥珀"
    },
    "5268305e6503989f": {
      "name": "水滴鱼微笑面罩"
    },
    "23dfd1075a93a33d": {
      "name": "小丑衬衫"
    },
    "324df9a75e061379": {
      "name": "BS拖鞋"
    },
    "127b76d4323e74bb": {
      "name": "两件式长袖上衣 白色"
    },
    "b4b3212cb5cd7bae": {
      "name": "海坊主坦克背心 主场"
    },
    "784d73e378d54a65": {
      "name": "高筒海马鞋 红色"
    },
    "5a2640a1b24f4104": {
      "name": "经典鱿鱼草帽"
    },
    "913c8abcf3b7f553": {
      "name": "懒人鞋 千鸟"
    },
    "2724594845943e60": {
      "name": "鱿鱼交叉套头衫 芥末黄"
    },
    "70e9d5e472ac488e": {
      "name": "海马古巴衬衫"
    },
    "1e8eb9a8cf359ddb": {
      "name": "鳄鱼鞋 巧克力"
    },
    "0f9024a487709d60": {
      "name": "饵木钓鞋4 红配黑"
    },
    "d8dc38f9cff8a7c0": {
      "name": "半框眼镜"
    },
    "536ee3c575414b1c": {
      "name": "猎鸭靴 白雪"
    },
    "aa6d34604fc32094": {
      "name": "鱿鱼先生T恤"
    },
    "93a1f4889a507aca": {
      "name": "高筒海马鞋 僵尸"
    },
    "74557810f479b67d": {
      "name": "箭标鞋 橘色"
    },
    "956b07f16e9239e5": {
      "name": "黑鸢防护面罩R255"
    },
    "917b0ff5e7deb49d": {
      "name": "剑尖教练外套"
    },
    "8cb74f9b9027d2e1": {
      "name": "两件式长袖上衣 芥末黄"
    },
    "633c2879fd8e03e7": {
      "name": "鱿鱼飞行外套"
    },
    "1612c8b009f235b2": {
      "name": "瓜皮帽"
    },
    "eb43f28ba5c38ec6": {
      "name": "鱿鱼V领T恤 白色"
    },
    "61e8f58a1c752d85": {
      "name": "散寿司T恤 糙米"
    },
    "81e8fd0b464e2414": {
      "name": "基地训练鞋 高手"
    },
    "fa6f79b5f26ce405": {
      "name": "无法无天法兰绒连帽上衣"
    },
    "a50223bf951b4680": {
      "name": "彼得朋克衬衫"
    },
    "f7c12d451f1fcd8f": {
      "name": "双鱼翅"
    },
    "68b8d5cfeb33c744": {
      "name": "箭标鞋 剑尖鱿特制"
    },
    "ae84b607bf8777f9": {
      "name": "烧河豚浴室拖鞋 红色"
    },
    "2e526124ce7e8f6f": {
      "name": "墨行帽"
    },
    "b8b4c69bd9db92ef": {
      "name": "长腿护甲 红色"
    },
    "a7919c8be2a28d62": {
      "name": "饵木钓鞋4 蓝配黑"
    },
    "3675b37346898e14": {
      "name": "王者橄榄球衫008"
    },
    "cdf0aa473ac99c5c": {
      "name": "虎鲸高筒鞋 日落"
    },
    "d00e44e66d68e35b": {
      "name": "罗肯贝格T恤 黑色"
    },
    "8edd77ea62ba9e9f": {
      "name": "王者橄榄球衫010"
    },
    "1fec43172d6fa45f": {
      "name": "单车衫"
    },
    "f90966ee929161d3": {
      "name": "查卡靴 三明治"
    },
    "3156cd52b7438c4a": {
      "name": "明星墨镜 18K"
    },
    "007b0011ba440126": {
      "name": "罗肯贝格T恤 白色"
    },
    "5f0b0a4b682ede5a": {
      "name": "非常非常拖鞋 洋红色"
    },
    "ed2f366255fe2400": {
      "name": "高筒帆布鞋 黄麻"
    },
    "1373e5fdef7d81d0": {
      "name": "羊毛海胆经典帽"
    },
    "65d7097e248028a8": {
      "name": "篮球运动服 主场"
    },
    "2f2c0867bcd60fa2": {
      "name": "有色眼镜"
    },
    "dc2d135b5dedc8d0": {
      "name": "泽酷插肩袖上衣"
    },
    "4318b892228fff97": {
      "name": "低筒鞋 蓝色"
    },
    "b7c5f3453773550b": {
      "name": "NNJ运动鞋 绿色"
    },
    "d0aa19a37f3cd296": {
      "name": "糖果运动鞋 蓝绿色"
    },
    "8a4df8e058429a82": {
      "name": "两件式长袖上衣 巧克力色"
    },
    "db62936fd681df2b": {
      "name": "鱿鱼T恤 黑色"
    },
    "41bedd53522bb38d": {
      "name": "乒乓头带"
    },
    "b815880233a35cd6": {
      "name": "高筒海马鞋 紫色"
    },
    "cfecc281c452aa74": {
      "name": "号角安全帽BF"
    },
    "e8ba8734c2ebfa80": {
      "name": "BB拖鞋"
    },
    "f83218ce2928e443": {
      "name": "暖流口罩"
    },
    "d8398bdfdddfb898": {
      "name": "烧河豚点阵T恤 黑色"
    },
    "441c1f7903f5412d": {
      "name": "磨砂皮革靴 黄色"
    },
    "c0630f568ecb669c": {
      "name": "脸部中空遮阳帽"
    },
    "bdbd666af9084dbe": {
      "name": "登山鞋 订制"
    },
    "fbc70cfb825986de": {
      "name": "灵光一闪安全帽"
    },
    "81be854769c15200": {
      "name": "鲶鱼飞行外套"
    },
    "baa3c99301fbf998": {
      "name": "网球头带"
    },
    "4261e5c7df04b91a": {
      "name": "鳄鱼鞋 牡蛎"
    },
    "f52b184f2b9aecb1": {
      "name": "向量图案T恤 灰色"
    },
    "b2446e7ab074da26": {
      "name": "散寿司T恤 红豆饭"
    },
    "2be678af332735c1": {
      "name": "暇古中空遮阳帽"
    },
    "e1acfff65d803f23": {
      "name": "暇古尼龙拉链上衣 怀旧"
    },
    "1f28c536cbdc80c2": {
      "name": "烧河豚点阵T恤 白色"
    },
    "386fb7e34a2abc2a": {
      "name": "头带 白色"
    },
    "f4d7dfa61cc72a67": {
      "name": "玳瑁圆形眼镜"
    },
    "4c02bd493cf9b01e": {
      "name": "高筒帆布鞋 番茄"
    },
    "7b854854cece266d": {
      "name": "斗笠"
    },
    "de236faed2faac4c": {
      "name": "登山外套 橄榄绿"
    },
    "1dc35b1abeefcd35": {
      "name": "模板喷画牛仔布帽"
    },
    "ad5679cf966d56d0": {
      "name": "魔鬼毡鞋 白色"
    },
    "678373bb7134e71d": {
      "name": "糖果运动鞋 粉红色"
    },
    "3c5acd12e6e2d7de": {
      "name": "无法无天口罩"
    },
    "4fea8b21041700fd": {
      "name": "帆立连帽上衣 灰色"
    },
    "2d60b55fc7167d95": {
      "name": "帆船鞋 深咖啡色"
    },
    "e2d69f22cb5653f5": {
      "name": "饮料标志帽"
    },
    "110ff0c454074cfa": {
      "name": "散寿司T恤 白米"
    },
    "9fa5cc8851fcf88c": {
      "name": "海胆BB帽"
    },
    "0f00a6635aede845": {
      "name": "伊卡洛斯曲棍球安全帽"
    },
    "f9ffbfce0e2875d0": {
      "name": "桶眼鱼护目镜"
    },
    "6f2d6bded7e3b5a3": {
      "name": "鱼片外套"
    },
    "eaff9715e83e69d6": {
      "name": "滚边T恤 凤梨"
    },
    "703d46b112a2fb1e": {
      "name": "非常非常拖鞋 绿蓝色"
    },
    "4fbc8152a1d9b11c": {
      "name": "鱿鱼丝T恤 白色"
    },
    "95a7d0caf568a88b": {
      "name": "贝壳安全帽"
    },
    "a64eaf2183a3df2a": {
      "name": "无法无天方形眼镜"
    },
    "2134bc4107ef589f": {
      "name": "无法无天厚底鞋 哈瓦那辣椒"
    },
    "f8d476712897b5ea": {
      "name": "很多Logo夏威夷衬衫"
    },
    "bc5773c0d48ba324": {
      "name": "鱿鱼渔夫帽"
    },
    "4397b925c765efa4": {
      "name": "降落伞上衣 石榴红"
    },
    "f7360a8678a652e1": {
      "name": "轻量羽绒外套 抹茶色"
    },
    "e592552a3149cbc2": {
      "name": "喷墨衬衫"
    },
    "896386102c8cc7c9": {
      "name": "钢铁先锋两件式长袖上衣"
    },
    "aa220e98e0b8ce4d": {
      "name": "绿色T恤"
    },
    "72d90ee8f6051b8e": {
      "name": "永远凉爽外套"
    },
    "eb19bc1bf079b53e": {
      "name": "工作室耳机"
    },
    "3a661f31ee2e6ae3": {
      "name": "海月海牛套头衫"
    },
    "215ca40180b6f437": {
      "name": "烧河豚中空遮阳帽"
    },
    "39bbd0d9f8a9be1e": {
      "name": "针织帽"
    },
    "154047abb13f296a": {
      "name": "MODZ-9"
    },
    "3165dd0fe53699ed": {
      "name": "鱿鱼眼T恤 黑色"
    },
    "4333c406473ac20d": {
      "name": "狩猎靴"
    },
    "5f3cbcd31423e391": {
      "name": "秋季法兰绒衬衫"
    },
    "49df3a5d8d0a99ac": {
      "name": "烧河豚浴室拖鞋 黄色"
    },
    "fb978d294c4a18b9": {
      "name": "短版小外套 负片"
    },
    "dd87314a71de50ff": {
      "name": "锻品口罩"
    },
    "926ada9976cdae43": {
      "name": "飞行员护目镜"
    },
    "97ed5418f991d678": {
      "name": "鱼片衬衫 野外观察"
    },
    "9c3d6d6c10d9d41f": {
      "name": "狩猎背心KK"
    },
    "c661525659d90ef4": {
      "name": "暇古网帽"
    },
    "dfeb51ebc84513c4": {
      "name": "扁面蛸夏威夷衬衫"
    },
    "67a744219d496350": {
      "name": "贝壳柱WO"
    },
    "8be6bc50a7bc8ab5": {
      "name": "怪物 PCU56"
    },
    "1cf11459184751e4": {
      "name": "登山鞋 轻量"
    },
    "df03a24d19aa6f8e": {
      "name": "再版T恤 蓝色"
    },
    "8ed3f04671809fb9": {
      "name": "3D针织衫 鲨鱼"
    },
    "b192c92961b2adf6": {
      "name": "鱼片衬衫 城市"
    },
    "809e99c2ffa7312a": {
      "name": "加百列T恤"
    },
    "c97a0167cc492b36": {
      "name": "非常非常拖鞋 橘色"
    },
    "476e9139880248e4": {
      "name": "无法无天T恤配颈链"
    },
    "a4d6ce587f7547b4": {
      "name": "箭标拖鞋 蓝黄色"
    },
    "9aec8fb9cb1ba2b8": {
      "name": "鱿鱼骑士皮外套 黑色"
    },
    "7df1610b801fb8e5": {
      "name": "竞技泳镜"
    },
    "fb29dd121ab3b5f2": {
      "name": "划桨外套 负片"
    },
    "3b84e904cd60534c": {
      "name": "巴哈连帽上衣 红色"
    },
    "445ffa87c30bbac0": {
      "name": "耳朵章鱼8"
    },
    "662beb4fb9ea74f9": {
      "name": "遮阳帽 墨黑"
    },
    "15d0c6619faead78": {
      "name": "捕手面罩FU"
    },
    "940500ce3bf4cc00": {
      "name": "MOVE跑鞋 红色"
    },
    "ff8cd1836a1d4fc2": {
      "name": "天亚8篮球鞋 红色"
    },
    "878e926050e1816b": {
      "name": "章鱼先生T恤"
    },
    "8bf529c3f3753265": {
      "name": "乒乓球Polo衫"
    },
    "e2a0872fdee7a498": {
      "name": "极光耳机"
    },
    "95b7d8bd81a014ae": {
      "name": "舞动鱿鱼夏威夷衬衫"
    },
    "f2184eafd208d20c": {
      "name": "章鱼保龄球衫"
    },
    "ed176e1f5f945985": {
      "name": "飞行员安全帽"
    },
    "4f4fc3a6e642be37": {
      "name": "墨汁喷洒衬衫"
    },
    "77d5515a65d72500": {
      "name": "依古T恤 五分袖"
    },
    "14c7c198c5f1332c": {
      "name": "滚边T恤 苹果"
    },
    "580b51c0cb8c045b": {
      "name": "短款圆顶毛帽"
    },
    "eb6566409e55ddad": {
      "name": "山岳T恤 蓝色"
    },
    "b4a91c3b5329437c": {
      "name": "轰炸机飞行外套 负片"
    },
    "99108a6528e78424": {
      "name": "鱿鱼眼T恤 浅蓝色"
    },
    "94fa81f8a11b0a30": {
      "name": "散寿司派克大衣"
    },
    "6da49b6929c446ee": {
      "name": "无法无天别针贝雷帽"
    },
    "a085384ce9c3e9ee": {
      "name": "无法无天厚底鞋 爵士经典"
    },
    "bd7a4b5395750d95": {
      "name": "贝壳鞋 巧克力"
    },
    "8540e611a17cd249": {
      "name": "火热渐层T恤"
    },
    "2f2e954b23c261c7": {
      "name": "单车帽"
    },
    "4301fb8489341eef": {
      "name": "装饰奖章鱼安全帽"
    },
    "9b8a23e17b1b5ea3": {
      "name": "佩斯利花纹丝巾"
    },
    "d4d0bc79dce60c64": {
      "name": "攀岩鞋 食舌虫"
    },
    "591b7bcd94410bf0": {
      "name": "露营帽"
    },
    "a217ef7797136fcb": {
      "name": "新叶鱿鱼T恤"
    },
    "29a7def9b876a301": {
      "name": "喷漆面罩"
    },
    "e1f937486dd6b7c9": {
      "name": "章鱼王星星口罩"
    },
    "ca976a3bc9cd78b2": {
      "name": "皇耆训练套头衫"
    },
    "972b9fce355daced": {
      "name": "磨砂皮革靴 红色"
    },
    "aa51588a1699ae25": {
      "name": "暇古扎染T恤 银河"
    },
    "38776da1845adf08": {
      "name": "河豚铃铛圆边帽"
    },
    "68a94c789b4c8b44": {
      "name": "摇滚靴 樱桃"
    },
    "76f5e76c784b1c50": {
      "name": "剑尖特制竞技泳镜"
    },
    "36e84fe6b7608c8c": {
      "name": "饵木钓鞋5 白配红"
    },
    "405281a377614420": {
      "name": "赞助商标摩托车安全帽"
    },
    "42ea283da9409cdb": {
      "name": "草食动物T恤"
    },
    "3c90c890a335af86": {
      "name": "莫卡辛鞋 鲨鱼"
    },
    "7262e999c5bad9da": {
      "name": "相撞鱿鱼背心"
    },
    "4faf2e67e092b400": {
      "name": "鱿鱼骨口罩"
    },
    "c639924b729138ab": {
      "name": "章鱼防风运动上衣 蓝色"
    },
    "c21aaf1b52292dc7": {
      "name": "F-190"
    },
    "26136d489a89af87": {
      "name": "遮阳郁金香帽"
    },
    "5483b9aa63533859": {
      "name": "狩猎外套KK"
    },
    "dac35d4c46be1969": {
      "name": "雨靴 青苔绿"
    },
    "1c6debb9237e2890": {
      "name": "渗透压毛绒外套 象牙色"
    },
    "94c1e453748a9abe": {
      "name": "无法无天针织衫 蓝色袖子"
    },
    "95fcba8b9a39cd62": {
      "name": "摇滚靴 黑色"
    },
    "1f6ddf2cf1d59bae": {
      "name": "三角带运动凉鞋 光亮"
    },
    "69be0ed9f464ea4a": {
      "name": "钉鞋 橙红"
    },
    "c2281bc39bd310d0": {
      "name": "复古黑框眼镜"
    },
    "17667e85698763c8": {
      "name": "海胆BB衬衫"
    },
    "37b13a41409cd558": {
      "name": "帆立贝牛仔帽"
    },
    "0316c51eca942a1c": {
      "name": "无法无天巴斯克贝雷帽"
    },
    "b443eba90e562d26": {
      "name": "海军雕花鞋 红底"
    },
    "7866d2e458dcc9fa": {
      "name": "散寿司披肩 海苔卷"
    },
    "a80df2b5cf118944": {
      "name": "冰原渐层T恤"
    },
    "94849c9f9b825920": {
      "name": "千鸟帽"
    },
    "417931be054a0f92": {
      "name": "鱿鱼交叉防护口罩"
    },
    "b867088a8ddb9a80": {
      "name": "鱿鱼僧侣鞋 驼色"
    },
    "6586ab2c5d8cd989": {
      "name": "消防盔"
    },
    "796fd2d7906261c9": {
      "name": "厚底鞋 白色"
    },
    "5de5a3a955b0f195": {
      "name": "多Logo棒球外套"
    },
    "0bd7ec5e419c3452": {
      "name": "房屋标签牛仔帽"
    },
    "e3a023a3f503e0be": {
      "name": "海蛞蝓鞋 黄色"
    },
    "1d3e46a11ffbec9c": {
      "name": "海盗风横纹T恤"
    },
    "87aa11437da121f4": {
      "name": "鱿鱼生鱼片 Scramble"
    },
    "ab11b6ea4ebdade0": {
      "name": "长版套头衫 负片"
    },
    "99e79d22b382f957": {
      "name": "章鱼T恤"
    },
    "f09f6db7abb23197": {
      "name": "圆形墨镜SV925"
    },
    "5cf438885bf2554f": {
      "name": "滑板安全帽"
    },
    "9c4320cc4dfec243": {
      "name": "三角带运动凉鞋 霓虹"
    },
    "a3c11aa2e7cf664c": {
      "name": "鱿鱼墨汁雕花鞋"
    },
    "03ec7a070e37e788": {
      "name": "肉食动物T恤"
    },
    "367af2966d3db91b": {
      "name": "懒人鞋 蓝色"
    },
    "e8158157baabac9d": {
      "name": "向量线条两件式长袖上衣"
    },
    "2e8ef62f986efb1a": {
      "name": "摇滚靴 白色"
    },
    "7e360df7a2031adb": {
      "name": "字母针织罩衫 绿色"
    },
    "1424ac52938446da": {
      "name": "墨汁脱落衬衫"
    },
    "86ed2bb62a052e30": {
      "name": "暇古扎染T恤 彩虹"
    },
    "3875567d34d4b02e": {
      "name": "羽绒靴 牛乳"
    },
    "0c80632bd1cd6e33": {
      "name": "高科技望远镜"
    },
    "77ec26940c8cb823": {
      "name": "无法无天章鱼图案T恤"
    },
    "d53fb73cf3178709": {
      "name": "位元水母帽"
    },
    "a4be5aeea14fb98e": {
      "name": "向量图案T恤 红色"
    },
    "18eb5bc19afe5630": {
      "name": "角色扮演高科技装"
    },
    "2e477937b45b9bf1": {
      "name": "网球头带"
    },
    "5d2dcaa61161c940": {
      "name": "再版T恤 蓝色"
    },
    "386633c7575f5799": {
      "name": "NNJ运动鞋 绿色"
    },
    "140bb5be8a10e415": {
      "name": "向量图案T恤 红色"
    },
    "8a06264363dc442e": {
      "name": "黑鸢防护面罩R255"
    },
    "c6943b3c0624caa6": {
      "name": "山岳T恤 蓝色"
    },
    "18ccd9c4c536cfcb": {
      "name": "狩猎靴"
    },
    "a51018edf02ccd2b": {
      "name": "无法无天别针贝雷帽"
    },
    "9dec389c738b37e0": {
      "name": "章鱼王星星口罩"
    },
    "8a54d8320180ed80": {
      "name": "角色扮演高科技装"
    },
    "7c4e57ac7c8125ad": {
      "name": "号角安全帽BF"
    },
    "27cde5ac6a27fc42": {
      "name": "冰原渐层T恤"
    },
    "3ae0b8c5b6a9c7d1": {
      "name": "贝壳柱WO"
    },
    "205209ff92cf9649": {
      "name": "无法无天方形眼镜"
    },
    "b1f0a05a6d48d75f": {
      "name": "暇古中空遮阳帽"
    },
    "0eae7f8f26b324a3": {
      "name": "暇古扎染T恤 银河"
    },
    "d40177e7c95129c4": {
      "name": "虎鲸高筒鞋 日落"
    },
    "1db8d62e28e3f777": {
      "name": "极光耳机"
    },
    "5e7cf04d1b4ebb65": {
      "name": "鱿鱼交叉套头衫 芥末黄"
    },
    "c437adc806514b68": {
      "name": "剑尖特制竞技泳镜"
    },
    "c7f4f236b1b1acaf": {
      "name": "两件式长袖上衣 白色"
    },
    "ff07fc7fea090c5d": {
      "name": "千鸟帽"
    },
    "f76a40701374d87f": {
      "name": "喷墨衬衫"
    },
    "d3aa78342476dabb": {
      "name": "01STER 琥珀"
    },
    "65f2389e2551aa9d": {
      "name": "白色衬衫"
    },
    "27e59065162c99fd": {
      "name": "渗透压毛绒外套 象牙色"
    },
    "0f0a9dc12a4785e3": {
      "name": "模板喷画牛仔布帽"
    },
    "77a0a7e69e9cb3eb": {
      "name": "桶眼鱼护目镜"
    },
    "871a7c71df6c0c13": {
      "name": "鲶鱼飞行外套"
    },
    "8b44b1dce41b50b6": {
      "name": "鱿鱼交叉防护口罩"
    },
    "56268700452c1b25": {
      "name": "鱿鱼T恤 黑色"
    },
    "80f6cfc13e62e6be": {
      "name": "头带 白色"
    },
    "b7e40a7b549a79dd": {
      "name": "鱼片衬衫 野外观察"
    },
    "9cea6b281c46f02d": {
      "name": "海军风横纹T恤"
    },
    "ec672b8e3a24967a": {
      "name": "箭标鞋 橘色"
    },
    "7cf59e349730844e": {
      "name": "鱿鱼骑士皮外套 黑色"
    },
    "d51664ffba14f9e2": {
      "name": "肉食动物T恤"
    },
    "4ccf03623757040e": {
      "name": "扁面蛸夏威夷衬衫"
    },
    "043c63fb45d5e851": {
      "name": "明星墨镜 18K"
    },
    "28ff27092935457f": {
      "name": "秋季法兰绒衬衫"
    },
    "c77eecb20c1f5181": {
      "name": "越野摩托车靴"
    },
    "56fd188f51ae97fb": {
      "name": "帆船鞋 深咖啡色"
    },
    "34b422786c86f418": {
      "name": "雨靴 青苔绿"
    },
    "cb0b7ab8e7295dbf": {
      "name": "烧河豚点阵T恤 白色"
    },
    "e0f4077174545fd4": {
      "name": "新叶鱿鱼T恤"
    },
    "31cca66cb8302359": {
      "name": "遮阳帽 墨黑"
    },
    "c21d764e16dbfdec": {
      "name": "怪物 PCU56"
    },
    "cbefacb0a5df777a": {
      "name": "查卡靴 三明治"
    },
    "89a2a0db33110dd2": {
      "name": "高筒帆布鞋 黄麻"
    },
    "e083c158245d4c48": {
      "name": "莫卡辛鞋 大白鲨"
    },
    "3270135c65096897": {
      "name": "莫卡辛鞋 鲨鱼"
    },
    "d230f1d9b960725d": {
      "name": "饮料标志帽"
    },
    "7e8413f7b3cf5ceb": {
      "name": "海马鞋 黑色皮革"
    },
    "616574265163e7e3": {
      "name": "王者橄榄球衫008"
    },
    "9346b1b98476bbc1": {
      "name": "饵木钓鞋5 白配红"
    },
    "847c2657f38e53ef": {
      "name": "迷彩长袖上衣 紫色"
    },
    "7b028b5cc1b7867d": {
      "name": "小小水母衬衫"
    },
    "e23a3865c0477fe8": {
      "name": "迷彩网帽"
    },
    "45e49487d33db87f": {
      "name": "箭标鞋 狂热"
    },
    "c4bba67c76b56fa1": {
      "name": "乒乓头带"
    },
    "8a7b18e5ddaae50f": {
      "name": "单车衫"
    },
    "ae64690d1dab8d29": {
      "name": "高筒海马鞋 紫色"
    },
    "4a6e438cb4859f08": {
      "name": "鱿鱼交叉长袖上衣"
    },
    "698e6beea41bd7f2": {
      "name": "海坊主坦克背心 主场"
    },
    "e84215bb7666d575": {
      "name": "海蛞蝓鞋 黄色"
    },
    "c41670529c10fb74": {
      "name": "羊毛海胆经典帽"
    },
    "7b9a5f033307914c": {
      "name": "低筒鞋 绿色限定版"
    },
    "52618e9157867562": {
      "name": "鱿鱼草帽"
    },
    "8ebfc778fd94f761": {
      "name": "帆立连帽上衣 灰色"
    },
    "373e8fe2e4aaef53": {
      "name": "北欧鱿鱼帽"
    },
    "e806e700efbcc80a": {
      "name": "魔鬼毡鞋 白色"
    },
    "e9eabd141adca3c8": {
      "name": "章鱼面罩"
    },
    "6c75edfc2aec9aff": {
      "name": "单车帽"
    },
    "2e5784eabfaf365a": {
      "name": "雨天蓝T恤"
    },
    "30b02d8f6e4ba5ce": {
      "name": "反戴帽"
    },
    "e8c17867f35e97ba": {
      "name": "乒乓球Polo衫"
    },
    "b8d03155b8359cd4": {
      "name": "雨靴 樱桃红"
    },
    "85113506dad12892": {
      "name": "糖果运动鞋 粉红色"
    },
    "8bb8e35a0861301b": {
      "name": "海蛞蝓鞋 紫色"
    },
    "1bc59e492b8e911b": {
      "name": "鱿鱼T恤 白色"
    },
    "a21a2cbeefca9a17": {
      "name": "捕手面罩FU"
    },
    "21121bbf04be0ce6": {
      "name": "海军雕花鞋 红底"
    },
    "32fb257fbc67458c": {
      "name": "章鱼墨镜"
    },
    "9e941af8fd7f3a65": {
      "name": "烧河豚浴室拖鞋 红色"
    },
    "754cbff89db13c07": {
      "name": "学院风套头衫 灰色"
    },
    "3223d4cf801cf75e": {
      "name": "摇滚靴 樱桃"
    },
    "15986ad4b8822172": {
      "name": "喷射帽"
    },
    "30b54946c324ee87": {
      "name": "工作室耳机"
    },
    "be93570b3dfcda47": {
      "name": "棒球运动服"
    },
    "e6b1d38ede3aa7d6": {
      "name": "复古黑框眼镜"
    },
    "a92b28638f891fd9": {
      "name": "海盗风横纹T恤"
    },
    "a333316891127558": {
      "name": "魔鬼毡鞋 红色"
    },
    "cbf435379fe95dff": {
      "name": "高筒帆布鞋 番茄"
    },
    "541a455fbe3a624a": {
      "name": "罗肯贝格T恤 黑色"
    },
    "dcb9dbc4b13d272a": {
      "name": "海月海牛套头衫"
    },
    "cab0f186ad1322fa": {
      "name": "登山鞋 订制"
    },
    "7715c2bcc13a974e": {
      "name": "低筒鞋 橘色"
    },
    "b9cbb286c50180de": {
      "name": "鳄鱼鞋 牡蛎"
    },
    "b9072da6fffeb4db": {
      "name": "浮法玻璃透明眼镜"
    },
    "49c4378193f79511": {
      "name": "狩猎外套KK"
    },
    "a01cfea15f866ef4": {
      "name": "箭标拖鞋 蓝黄色"
    },
    "4db166f77d487365": {
      "name": "字母针织罩衫 绿色"
    },
    "2667f143da0e2bd4": {
      "name": "鱿鱼骑士皮外套 白色"
    },
    "ace43854cbc4c9f9": {
      "name": "鱿鱼生鱼片 Scramble"
    },
    "d45bcfa397aec03c": {
      "name": "羽绒靴 牛乳"
    },
    "804b511b4d2053d0": {
      "name": "斯普拉护目镜"
    },
    "b6d4e4220aa18f5f": {
      "name": "鱿鱼水手服 白色"
    },
    "9d3c5380b5ca659e": {
      "name": "骨传导鳍挂式耳机EP"
    },
    "d0b16b85d6dc11ca": {
      "name": "MODZ-9"
    },
    "bd7d231965eefb39": {
      "name": "多Logo棒球外套"
    },
    "da568279ee87fafa": {
      "name": "宝藏安全帽"
    },
    "e8cbe3c7f691dadc": {
      "name": "帆布鞋 小丑鱼"
    },
    "c71f63b8ad569ac4": {
      "name": "立体声录音机耳机"
    },
    "be9ae82550da96a3": {
      "name": "无法无天巴斯克贝雷帽"
    },
    "3528e2b33fb9474a": {
      "name": "无法无天法兰绒连帽上衣"
    },
    "e87cc4250b483a12": {
      "name": "无法无天厚底鞋 哈瓦那辣椒"
    },
    "c7cdb065c09f67a4": {
      "name": "向量线条两件式长袖上衣"
    },
    "4ed3a76fa6dfb413": {
      "name": "暖流口罩"
    },
    "5db0e9f8bd1dff6a": {
      "name": "摇滚靴 黄色"
    },
    "9e41a2025ac3bccd": {
      "name": "鱿鱼眼T恤 黑色"
    },
    "cac6c7a04df6f1fa": {
      "name": "山核桃条纹工作帽"
    },
    "a78a614805f7a641": {
      "name": "上升鱿鱼背心"
    },
    "5aa899466fa9ddc9": {
      "name": "章鱼防风运动上衣 蓝色"
    },
    "84dc6deb53cc912d": {
      "name": "绿色T恤"
    },
    "8d93a94ab2bdb735": {
      "name": "壁球头带"
    },
    "e7ebb9753dfbdcc8": {
      "name": "单车王者帽"
    },
    "5633908a845e4e7c": {
      "name": "鱿鱼眼T恤 浅蓝色"
    },
    "c4093a765f80e764": {
      "name": "海蛞蝓鞋 红色"
    },
    "aa7ea4b2b45eae59": {
      "name": "野外观察圆边帽"
    },
    "dc2e86e88752af50": {
      "name": "3D针织衫 鲨鱼"
    },
    "4823fbbefd97ec52": {
      "name": "长版套头衫 负片"
    },
    "26d9563c7966ad10": {
      "name": "双线网帽"
    },
    "ab1ceac8d4b32ee8": {
      "name": "海胆BB衬衫"
    },
    "7725ed498aefb0e5": {
      "name": "鱿鱼飞行外套"
    },
    "324a1892277505c4": {
      "name": "海马鞋 黄色"
    },
    "e9887854adfe42f4": {
      "name": "短版小外套 负片"
    },
    "fa42c0f96a64140a": {
      "name": "箭标鞋 剑尖鱿特制"
    },
    "b35955d7b890005d": {
      "name": "海蛞蝓鞋 蓝色"
    },
    "23f2126b48533e18": {
      "name": "章鱼保龄球衫"
    },
    "151deacf70ff815c": {
      "name": "非常非常拖鞋 洋红色"
    },
    "7de63a6ea3188e45": {
      "name": "MOVE跑鞋 红色"
    },
    "f2a97473b7ff4994": {
      "name": "罗肯贝格T恤 白色"
    },
    "eeb7f851d6d03a1c": {
      "name": "FC乌鱼子制服"
    },
    "f49599b4fce20615": {
      "name": "能力重置高筒鞋"
    },
    "dec2087ca8cb0bfc": {
      "name": "单车安全帽"
    },
    "11b5ac727232c981": {
      "name": "鱿鱼僧侣鞋 驼色"
    },
    "aeaac39e2dc204f3": {
      "name": "绣花衬衫 烟管鱼"
    },
    "0ec5cbbcd16bfe95": {
      "name": "高筒海马鞋 红色"
    },
    "43b1330110d98b43": {
      "name": "遮阳板安全帽"
    },
    "0cb3ba242150ff62": {
      "name": "墨行帽"
    },
    "22b36194c34496c8": {
      "name": "鱿鱼渔夫帽"
    },
    "ef331a7388c97a29": {
      "name": "足球头带"
    },
    "1a34c66ac04618f2": {
      "name": "牙买加鱿鱼T恤"
    },
    "5c6f69c9b678391a": {
      "name": "泽酷网帽"
    },
    "53342e08f018501c": {
      "name": "嘉顿格纹衬衫 红色"
    },
    "22b42ad62ddcd07a": {
      "name": "单车王者运动服"
    },
    "b385c1e1cb26d5ed": {
      "name": "加百列T恤"
    },
    "60ca4729e3f15d1e": {
      "name": "针织帽"
    },
    "21f40c5b5e0944c9": {
      "name": "懒人鞋 蓝色"
    },
    "15cc79efd51771b5": {
      "name": "三角带运动凉鞋 霓虹"
    },
    "a37864e4d90d134b": {
      "name": "篮球头带"
    },
    "010738818c392695": {
      "name": "皇耆训练套头衫"
    },
    "4a2353a1575a8290": {
      "name": "纹甲贝雷帽"
    },
    "b2ad2d5ea085054d": {
      "name": "依古T恤 五分袖"
    },
    "e310c94042779445": {
      "name": "天亚8篮球鞋 红色"
    },
    "52a43aa594631dac": {
      "name": "竞技泳镜"
    },
    "5875ae7d9d7b9bc9": {
      "name": "鱿鱼刺绣西部衬衫"
    },
    "5ac23847a7403f5f": {
      "name": "眼镜固定带 白色"
    },
    "a8798b39bbe60dc9": {
      "name": "泽酷连帽上衣 红豆色"
    },
    "2f6897d5337ef3c7": {
      "name": "低筒鞋 蓝色"
    },
    "670ca2ce87b93517": {
      "name": "火热渐层T恤"
    },
    "014836c7ad07a8a0": {
      "name": "藻萨多足球队制服"
    },
    "7977b53f60122aa5": {
      "name": "永远凉爽外套"
    },
    "b3b468c4167d50c9": {
      "name": "章鱼先生T恤"
    },
    "c1fb87d0986b3110": {
      "name": "骑士偏光眼镜"
    },
    "7deaf3ffc38d6e26": {
      "name": "散寿司披肩 海苔卷"
    },
    "c1e95c3e79957842": {
      "name": "基地训练鞋 入门"
    },
    "e0db7f21921c8896": {
      "name": "半框眼镜"
    },
    "663d2d0d77d19f7a": {
      "name": "狩猎背心KK"
    },
    "5ef885ea53ba7623": {
      "name": "贝壳安全帽"
    },
    "feefadef9c6913ca": {
      "name": "巴哈连帽上衣 红色"
    },
    "8704ea9cb1b02be6": {
      "name": "非常非常拖鞋 绿蓝色"
    },
    "481c98f17ad59d5a": {
      "name": "双鱼翅"
    },
    "a029e2ef214c22fe": {
      "name": "篮球运动服 客场"
    },
    "ad006f42035ebcb4": {
      "name": "露营帽"
    },
    "48e546f1426ac978": {
      "name": "登山外套 莓果红"
    },
    "2282d3ec5c8051f0": {
      "name": "登山鞋 轻量"
    },
    "071368490f760424": {
      "name": "划桨外套 负片"
    },
    "412636790b35a65c": {
      "name": "钉鞋 橙红"
    },
    "596fa31adf4aa87a": {
      "name": "学校运动服"
    },
    "82f87be2c3a9473c": {
      "name": "鱿鱼水手服 蓝色"
    },
    "2c518328e23b6c3b": {
      "name": "散寿司T恤 糙米"
    },
    "e73c1d9a445cda99": {
      "name": "青年布衬衫"
    },
    "10ab2df57e67ba18": {
      "name": "蛸壶安全帽"
    },
    "29f17fd823703a0f": {
      "name": "海马古巴衬衫"
    },
    "35ffc82643c8e185": {
      "name": "圆领衬衫"
    },
    "f83c3e0b0e67da46": {
      "name": "BS拖鞋"
    },
    "2b091623c0a70815": {
      "name": "降落伞上衣 石榴红"
    },
    "2611e40d7416a442": {
      "name": "烧河豚点阵T恤 黑色"
    },
    "3e202b6ce2a582f1": {
      "name": "玳瑁圆形眼镜"
    },
    "330aacc363e5845e": {
      "name": "高筒帆布鞋 蘑菇"
    },
    "9d9836d97fda8ac7": {
      "name": "章鱼T恤"
    },
    "72a39ca7750ebc9a": {
      "name": "无法无天口罩"
    },
    "1653c4bd81c1fca0": {
      "name": "球球毛帽"
    },
    "8f2be32a75ddae98": {
      "name": "无法无天T恤配颈链"
    },
    "e6e15e567a79ecad": {
      "name": "鱼片衬衫 城市"
    },
    "13247e74e366ad11": {
      "name": "暇古扎染T恤 彩虹"
    },
    "7244bbb6fa6dd60c": {
      "name": "长腿护甲 红色"
    },
    "d3e8ec173f27043d": {
      "name": "三色橄榄球衫"
    },
    "5be2787b792c09bb": {
      "name": "帆立贝牛仔帽"
    },
    "87b6100f3777fe50": {
      "name": "插肩袖上衣 白色"
    },
    "feb663db4af39d2d": {
      "name": "磨砂皮革靴 黄色"
    },
    "6531683ab4673e80": {
      "name": "贝壳鞋 巧克力"
    },
    "b1602fce67fb450e": {
      "name": "领带衬衫"
    },
    "7121355fe5d80761": {
      "name": "王者橄榄球衫010"
    },
    "2ff1222353bca464": {
      "name": "饵木钓鞋4 蓝配黑"
    },
    "f870b775538d7bda": {
      "name": "经典圆顶礼帽"
    },
    "9cf4622ca7ce7e55": {
      "name": "山岳T恤 象牙色"
    },
    "e2aff5329f12f6c0": {
      "name": "潜水护目镜"
    },
    "5ef6db896d91815e": {
      "name": "暇古网帽"
    },
    "b230bdd781e25f18": {
      "name": "两件式长袖上衣 巧克力色"
    },
    "26bde4f6c5b85ed2": {
      "name": "两件式长袖上衣 芥末黄"
    },
    "8e1ef333aba79d20": {
      "name": "位元水母帽"
    },
    "0b7dde5389d0ee8b": {
      "name": "很多Logo夏威夷衬衫"
    },
    "b9b4cb55323a7527": {
      "name": "BB拖鞋"
    },
    "59522e8c6e0c07d6": {
      "name": "糖果运动鞋 黑色"
    },
    "f96b3d08eb0694a1": {
      "name": "篮球运动服 主场"
    },
    "058141cd5b316d2f": {
      "name": "非常非常拖鞋 橘色"
    },
    "d34760401e956f50": {
      "name": "瓜皮帽"
    },
    "f7eaa5e5ba5a13b7": {
      "name": "散寿司T恤 白米"
    },
    "0d687aec1c2a6479": {
      "name": "嘉顿格纹衬衫 绿色"
    },
    "1436f36ed60576f8": {
      "name": "饵木钓鞋4 红配黑"
    },
    "1dcd176bcc8a9a81": {
      "name": "轻量羽绒外套 抹茶色"
    },
    "e8114c9ecd6ac82a": {
      "name": "复古运动服"
    },
    "6ee344613c5c028e": {
      "name": "喷漆面罩"
    },
    "52808e2a2d63e506": {
      "name": "锻品口罩"
    },
    "05f55d34f1214a58": {
      "name": "船锚套头衫"
    },
    "d775d09a4140449f": {
      "name": "横纹橄榄球衫 橘色"
    },
    "39bcec4d0355d54a": {
      "name": "散寿司派克大衣"
    },
    "7ed4455ab20f5eae": {
      "name": "滑轮套头衫"
    },
    "0251669c9a2a4b5e": {
      "name": "登山外套 橄榄绿"
    },
    "5c7a84791c254160": {
      "name": "横纹长袖上衣 海军蓝"
    },
    "4b8cb6a0fe561b78": {
      "name": "真格两件式长袖上衣"
    },
    "e827b09ca8ef70b4": {
      "name": "烧河豚浴室拖鞋 黄色"
    },
    "55ccbc201e874773": {
      "name": "拉链连帽外套 绿色"
    },
    "e989c1d6fbf8793d": {
      "name": "飞行员护目镜"
    },
    "96d5af4512d5ae03": {
      "name": "真格T恤 黑色"
    },
    "ad08c74748807719": {
      "name": "长袖上衣 黑色"
    },
    "b460886d43061423": {
      "name": "摇滚靴 白色"
    },
    "52c409d170293a57": {
      "name": "糖果运动鞋 蓝绿色"
    },
    "63d8eaa93e3fc816": {
      "name": "横纹长袖上衣 白色"
    },
    "79cac08df90185e7": {
      "name": "烧河豚中空遮阳帽"
    },
    "7f2c6e310407338f": {
      "name": "水滴鱼微笑面罩"
    },
    "2e7f830522350b1e": {
      "name": "耳朵章鱼8"
    },
    "172290d83938d008": {
      "name": "遮阳郁金香帽"
    },
    "ad48083990ed95aa": {
      "name": "海胆BB帽"
    },
    "9157ea3a67f9fac5": {
      "name": "脸部中空遮阳帽"
    },
    "bdd419c8c5293d6e": {
      "name": "钢铁先锋两件式长袖上衣"
    },
    "d4c18fe2dd802194": {
      "name": "学院风插肩袖上衣"
    },
    "4acbce907f616512": {
      "name": "学院风套头衫 海军蓝"
    },
    "d0b621ef1d45f241": {
      "name": "圆形墨镜SV925"
    },
    "7e300376c8890289": {
      "name": "厚底鞋 白色"
    },
    "a055f015e95f240e": {
      "name": "怀旧格纹衬衫"
    },
    "fbef99853ff68885": {
      "name": "艳阳中空遮阳帽"
    },
    "31ea6a3eea5e21f0": {
      "name": "鱼片外套"
    },
    "9816563e1a920b12": {
      "name": "钉鞋 稀有"
    },
    "d947da422eddbbef": {
      "name": "F-010"
    },
    "841935d5b21844f4": {
      "name": "护目镜面罩"
    },
    "7f3e6124903c83f1": {
      "name": "伊卡洛斯曲棍球安全帽"
    },
    "fac3e478c9f3f182": {
      "name": "日落渐层T恤"
    },
    "01b1662df8836f48": {
      "name": "战斗长袖上衣 白色"
    },
    "85e9989386171c1f": {
      "name": "基地训练鞋 高手"
    },
    "2fbabdc653413803": {
      "name": "滚边T恤 凤梨"
    },
    "357263d4f91f363e": {
      "name": "赞助商标摩托车安全帽"
    },
    "bb6d68f21888cbfa": {
      "name": "墨汁脱落衬衫"
    },
    "bd7c6a8f0191ed38": {
      "name": "滑板安全帽"
    },
    "52e9806c34abb0b0": {
      "name": "守卫者装"
    },
    "162f1b11ca51e2fd": {
      "name": "斗笠"
    },
    "36a5806084910ef4": {
      "name": "暖流套头衫 海军蓝"
    },
    "03d8d2955078ee57": {
      "name": "千鸟哈密瓜绿T恤"
    },
    "4eb117d3a5aa5455": {
      "name": "球童中空遮阳帽"
    },
    "e42387337f76faf6": {
      "name": "城市背心 黄色"
    },
    "3125b00f7fd15cad": {
      "name": "晴天橘T恤"
    },
    "aa16c23045178494": {
      "name": "轰炸机飞行外套 负片"
    },
    "fb19bfd12b79e32d": {
      "name": "攀岩鞋 食舌虫"
    },
    "c1cdbefa0d3d2f70": {
      "name": "房屋标签牛仔帽"
    },
    "834b9f01cf020eb7": {
      "name": "拼接衬衫 灰色"
    },
    "cd97547e9c6a599a": {
      "name": "登山羽绒背心"
    },
    "caf2aa40d9aec693": {
      "name": "烤鱿鱼雕花鞋"
    },
    "4a90769cb6dd4986": {
      "name": "无法无天长袖T恤 驾驶"
    },
    "88416ed7bd575c5f": {
      "name": "鱿鱼V领T恤 白色"
    },
    "b10618ef7470423a": {
      "name": "无法无天针织衫 蓝色袖子"
    },
    "aced009ff69cddcb": {
      "name": "小丑衬衫"
    },
    "e3253efb57c5b7b4": {
      "name": "暮光渐层T恤"
    },
    "f9fc2fd370f27f0f": {
      "name": "散寿司T恤 红豆饭"
    },
    "441fc9c609fb78db": {
      "name": "越野摩托车靴 纯蓝色"
    },
    "72107d39c7bcdded": {
      "name": "懒人鞋 千鸟"
    },
    "93707121f776c182": {
      "name": "懒人鞋 红色"
    },
    "1989f89bb3683c76": {
      "name": "龙虾登山帽"
    },
    "0f6542c7bce6a1bc": {
      "name": "冬季球球毛帽"
    },
    "d76287251a1e80d6": {
      "name": "眼镜固定带 黑色"
    },
    "8213bcccf19e57af": {
      "name": "钢铁先锋长袖上衣"
    },
    "d9943c007083e6f7": {
      "name": "条纹衬衫"
    },
    "221d0311cd12d185": {
      "name": "猎鸭靴 白雪"
    },
    "f2575241e38df613": {
      "name": "两件式长袖上衣 黑色"
    },
    "d945e6abb1a996a1": {
      "name": "薄荷绿T恤"
    },
    "8031db4a158a3989": {
      "name": "佩斯利花纹丝巾"
    },
    "533d8059221cc2b4": {
      "name": "再版T恤 棕色"
    },
    "dc83c3421324afe6": {
      "name": "短款圆顶毛帽"
    },
    "ce0e032a9b4af85d": {
      "name": "横纹长袖上衣 青苔绿"
    },
    "9dff73f3667fdcb6": {
      "name": "横纹圆顶毛帽"
    },
    "42ab92eaf82e62c2": {
      "name": "海马鞋 白色"
    },
    "5cda8399729f1da0": {
      "name": "摇滚靴 黑色"
    },
    "4da9a3e38eacbe7e": {
      "name": "舞动鱿鱼夏威夷衬衫"
    },
    "32cd97b7e0986fac": {
      "name": "无法无天章鱼图案T恤"
    },
    "0d3ee1609e03de03": {
      "name": "无法无天厚底鞋 爵士经典"
    },
    "27b32d23702d94c3": {
      "name": "隐藏版海盗上衣"
    },
    "a36e93fc754b5976": {
      "name": "高筒海马鞋 僵尸"
    },
    "c8666480bf24eb6d": {
      "name": "烧河豚丝巾 饼干"
    },
    "53af593f14387630": {
      "name": "草食动物T恤"
    },
    "0fb0286fad46c510": {
      "name": "露营圆边帽"
    },
    "441a9f62090040d4": {
      "name": "鳄鱼鞋 巧克力"
    },
    "2691ff00a9194f98": {
      "name": "厚底鞋 绿松石"
    },
    "b4efe275a0125131": {
      "name": "山岳横纹长袖上衣"
    },
    "181f44dc42cbf585": {
      "name": "FC运动服"
    },
    "59792e4065882111": {
      "name": "墨汁喷洒衬衫"
    },
    "9054693c3406b3b6": {
      "name": "守卫者帽"
    },
    "6edabb924ca30eba": {
      "name": "滚边T恤 苹果"
    },
    "b0cdccea20fe9e90": {
      "name": "高筒海马鞋 金色"
    },
    "213291c16e6652c8": {
      "name": "显眼隐形眼镜"
    },
    "935b340da97b0b66": {
      "name": "向量图案T恤 灰色"
    },
    "1de5be8ab33dceac": {
      "name": "夜视镜"
    },
    "937c341f17e5a9c1": {
      "name": "帆布鞋 香蕉"
    },
    "f2188922df753fe4": {
      "name": "Polo衫 艾草绿"
    },
    "ff76780318953100": {
      "name": "跑步头带"
    },
    "6cdfd6177ee63ef1": {
      "name": "鱿鱼墨汁雕花鞋"
    },
    "cdcc3d261b2c1828": {
      "name": "厚底鞋 樱桃"
    },
    "5bf6555d90b4df74": {
      "name": "剑尖教练外套"
    },
    "46820b5e398d1e36": {
      "name": "彼得朋克衬衫"
    },
    "4d4bb2908b58e139": {
      "name": "三角带运动凉鞋 光亮"
    },
    "763d513ccca9bf8b": {
      "name": "鱿鱼先生T恤"
    },
    "3979fa46ebaba2a7": {
      "name": "贝纹斗笠"
    },
    "b0870bfc3eb49fe3": {
      "name": "城市背心 夜空蓝"
    },
    "6ec52267789770f5": {
      "name": "登山鞋 专业"
    },
    "998629eaaa157867": {
      "name": "五分割帽"
    },
    "b7f3e26f8a1544f7": {
      "name": "视魄UD"
    }
  },
  "powers": {
    "032c2b30027d6a23": {
      "name": "提升墨汁效率（主要武器）"
    },
    "294d158b20a03702": {
      "name": "回归"
    },
    "8eff7c5906b17202": {
      "name": "鱿鱼忍者"
    },
    "a6ee72ab2e279e1d": {
      "name": "提升鱿鱼冲刺速度"
    },
    "793e8f393b093b33": {
      "name": "隐身跳跃"
    },
    "7491b2168b321d3e": {
      "name": "缩短超级跳跃时间"
    },
    "9a736dd26cc6d3c5": {
      "name": "提升人类移动速度"
    },
    "ea552d4a7c94a0eb": {
      "name": "受身术"
    },
    "1a994b9f1d422b23": {
      "name": "提升特殊武器性能"
    },
    "4b8e1b77f6b1ef60": {
      "name": "？"
    },
    "1406c4da9fe690c9": {
      "name": "提升墨汁效率（主要武器）"
    },
    "c8179c066b561cd5": {
      "name": "回归"
    },
    "0e71bff24c3f37ad": {
      "name": "鱿鱼忍者"
    },
    "03c7b7bc6cb68512": {
      "name": "提升鱿鱼冲刺速度"
    },
    "b4e72a2b9c9f3d53": {
      "name": "隐身跳跃"
    },
    "1f86150af97debf6": {
      "name": "缩短超级跳跃时间"
    },
    "16cbf780227d6f6d": {
      "name": "提升人类移动速度"
    },
    "c54714a0c4aa3e11": {
      "name": "受身术"
    },
    "e2c02f122de2c567": {
      "name": "提升特殊武器性能"
    },
    "264ff06a6e99b11a": {
      "name": "问号"
    },
    "1d202ffb6e81bce5": {
      "name": "提升复活惩罚"
    },
    "815a9a65c869e5d9": {
      "name": "减轻次要武器影响"
    },
    "d419d93c9ca266f2": {
      "name": "减轻对手墨汁影响"
    },
    "0e164aae93afae43": {
      "name": "降低特殊武器减少量"
    },
    "28c5ec4430082450": {
      "name": "缩短复活时间"
    },
    "aedd94fe223261d5": {
      "name": "行动强化"
    },
    "c43ab03140bb13f2": {
      "name": "提升墨汁回复力"
    },
    "6dcecca7e07e73c4": {
      "name": "提升特殊武器增加量"
    },
    "8afb83ffeb289865": {
      "name": "复仇"
    },
    "9d5a18e4c5e5645e": {
      "name": "最初冲刺"
    },
    "0e2ac5e15d77b2cb": {
      "name": "提升次要武器性能"
    },
    "3820d64c12f27290": {
      "name": "提升对物体攻击力"
    },
    "8340c4eed8943fc7": {
      "name": "提升墨汁效率（次要武器）"
    },
    "5602e981c1c00258": {
      "name": "热力墨汁"
    },
    "44d2c5620c1d3c73": {
      "name": "逆境强化"
    },
    "51f03088c1111fd7": {
      "name": "最后冲刺"
    },
    "d00bc8d303659ec6": {
      "name": "提升墨汁回复力"
    },
    "41a16a26faa38d13": {
      "name": "缩短复活时间"
    },
    "bde0eb22530d4466": {
      "name": "提升特殊武器增加量"
    },
    "86cdcc0fd608423a": {
      "name": "受身术"
    },
    "276cddac2f57fa12": {
      "name": "提升复活惩罚"
    },
    "cd3ddfd6e986e696": {
      "name": "提升特殊武器性能"
    },
    "92122d477e563d7b": {
      "name": "减轻对手墨汁影响"
    },
    "cef7771e1562e6f9": {
      "name": "问号"
    },
    "1d855c39cfd4d1ad": {
      "name": "减轻次要武器影响"
    },
    "4eb2633ea2cc53c5": {
      "name": "提升次要武器性能"
    },
    "65995d04d06440c3": {
      "name": "行动强化"
    },
    "57aceb0bcb925e93": {
      "name": "提升墨汁效率（次要武器）"
    },
    "73e2e892e74ab1b9": {
      "name": "最后冲刺"
    },
    "0c8e815c244cde48": {
      "name": "逆境强化"
    },
    "620af3d72bd265ea": {
      "name": "提升鱿鱼冲刺速度"
    },
    "870b81ce67189ad3": {
      "name": "复仇"
    },
    "8182fe5e6b07ef53": {
      "name": "提升墨汁效率（主要武器）"
    },
    "3d1ad74f74989f8d": {
      "name": "缩短超级跳跃时间"
    },
    "fad0ac5cace2e2a4": {
      "name": "提升人类移动速度"
    },
    "cf48bc70458f9b0b": {
      "name": "热力墨汁"
    },
    "98f9e51856a7a8fb": {
      "name": "鱿鱼忍者"
    },
    "e6087224d046f0dc": {
      "name": "降低特殊武器减少量"
    },
    "009a41cd1f5702c0": {
      "name": "隐身跳跃"
    },
    "23fa65038ff7b3be": {
      "name": "回归"
    },
    "f60a2e453b279d3c": {
      "name": "提升对物体攻击力"
    },
    "3d4c8db9a6144122": {
      "name": "最初冲刺"
    }
  },
  "festivals": {
    "JUEA-00004": {
      "title": "巧克力就要选这种！",
      "teams": [
        {
          "teamName": "苦甜巧克力"
        },
        {
          "teamName": "牛奶巧克力"
        },
        {
          "teamName": "白巧克力"
        }
      ]
    },
    "JUEA-00003": {
      "title": "喜欢的口味是什么呢？",
      "teams": [
        {
          "teamName": "辣"
        },
        {
          "teamName": "甜"
        },
        {
          "teamName": "酸"
        }
      ]
    },
    "JUEA-00002": {
      "title": "要选哪种属性的搭档呢？",
      "teams": [
        {
          "teamName": "草"
        },
        {
          "teamName": "火"
        },
        {
          "teamName": "水"
        }
      ]
    },
    "JUEA-00001": {
      "title": "你会带什么去无人岛？",
      "teams": [
        {
          "teamName": "工具"
        },
        {
          "teamName": "食物"
        },
        {
          "teamName": "打发时间的东西"
        }
      ]
    },
    "JUEA-00005": {
      "title": "真实存在的是？",
      "teams": [
        {
          "teamName": "尼斯湖水怪"
        },
        {
          "teamName": "外星人"
        },
        {
          "teamName": "雪怪"
        }
      ]
    },
    "JUEA-00006": {
      "title": "汝在追求什么？",
      "teams": [
        {
          "teamName": "力量"
        },
        {
          "teamName": "智慧"
        },
        {
          "teamName": "勇气"
        }
      ]
    }
  },
  "events": {
    "TGVhZ3VlTWF0Y2hFdmVudC1OZXdTZWFzb25DdXA=": {
      "name": "新赛季开幕纪念杯",
      "desc": "新赛季开幕！攻略新场地！",
      "regulation": "新赛季开幕！攻略新场地！<br /><br />·对战的舞台为新场地！<br />·进行占地对战时，只有基本装备能力会生效！追加装备能力不会有效果哦！<br />·采用蛮颓比赛的规则时，装备能力不会受到限制哦！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1TcGVjaWFsUnVzaF9VbHRyYVNob3Q=": {
      "name": "终极发射狂欢祭",
      "desc": "无限使用终极发射的疯狂对战！",
      "regulation": "无限使用终极发射的疯狂对战！<br /><br />·仅限使用的特殊武器为终极发射的武器！<br />·特殊武器蓄力槽会自动快速积攒哦！<br />·只有基本装备能力会生效！追加装备能力不会有效果哦！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1SYW5kb21XZWFwb24=": {
      "name": "爱惜使用各种武器的武器子杯",
      "desc": "武器随机决定！掌握各种武器的用法吧！",
      "regulation": "武器随机决定！掌握各种武器的用法吧！<br /><br />·每场对战都会随机决定武器哦！<br />·武器由主办方出借，无需自备！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1Nb250aGx5TGVhZ3VlTWF0Y2hSZWFs": {
      "name": "月一·活动比赛",
      "desc": "每月一次的挑战对战！目标是达到活动战力的极限！",
      "regulation": "每月一次的挑战对战！目标是达到活动战力的极限！<br /><br />·进行占地对战时，只有基本装备能力会生效！追加装备能力不会有效果哦！<br />·采用蛮颓比赛的规则时，装备能力不会受到限制哦！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1EZWVwRm9n": {
      "name": "迷雾之战",
      "desc": "眼前迷雾重重？！视野不佳的偷袭对战！",
      "regulation": "眼前迷雾重重？！视野不佳的偷袭对战！<br /><br />·在被迷雾笼罩导致视野不佳的场地展开战斗哦！<br />·迷雾的浓度会随时间发生变化哦！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1QYWlyQ3Vw": {
      "name": "最强搭档争夺战",
      "desc": "展现两人的默契！2对2的小规模对战！",
      "regulation": "展现两人的默契！2对2的小规模对战！<br /><br />·为2对2的小规模对战！<br />·能以2人队伍或独自1人参加哦！<br />·复活时间将会缩短哦！"
    },
    "TGVhZ3VlTWF0Y2hFdmVudC1XZWFwb25MaW1pdGVkX1JvbGxlckJydXNo": {
      "name": "最强滚筒&画笔争夺战",
      "desc": "限定武器对战！目标是成为最强的滚筒&画笔操作者！",
      "regulation": "限定武器对战！目标是成为最强的滚筒&画笔操作者！<br /><br />·仅限使用类型为滚筒或画笔的武器！"
    }
  }
}
`;
      translate_data = JSON.parse(translate_data);
      return translate_data;
    }
  };

  // 注册命令
  ext.cmdMap["splt"] = cmdSplatoon;
  ext.cmdMap["splatoon"] = cmdSplatoon;

  // 注册扩展
  seal.ext.register(ext);
}
