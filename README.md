# flyfishbird
cocos creator framework

本框架将ui和data分离，data修改后ui自动同步。使程序更专注于游戏逻辑。

1、目录分布

- resources： creator的默认bundle
    - scripts： 此bundle下的代码文件夹

- bundle1： 自定义的bundle，与resources目录结构一样

- scripts： 基础代码文件夹


2、使用



common data 上不能定义 node 属性（无法确定是哪个节点）
除common data 上对应节点外，其他不同模块节点名不要重复，否则将会无法修改。
例如：

{
    home:{
        money_Label:100,
    },
    shop:{
        money_Label:100,
    }
}

上面代码将会导致 shop 模块中的 money_Label 修改无效。
如果两个money都是代表玩家的当前金币，建议移动到 common data 上

{
    commom:{
        money_Label:100,
    }
}

如果两个money是两个独立的含义，可以添加不同的前缀，修改成
{
    home:{
        home_money_Label:100,
    },
    shop:{
        sign_money_Label:100,
    }
}