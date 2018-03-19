var path = require('path');
var webpack = require('webpack');
var glob = require('glob');

var jPlugins = require("./jPlugins");

//var commonsPlugin = new webpack.optimize.CommonsChunkPlugin('common.js');

var projDirName = path.basename(__dirname),
    envName = process.env.NODE_ENV, // 打包环境
    pack = {
        isDev: envName.indexOf('dev') == 0, // 是否是本地开发环境
        isTest: envName.indexOf('test') == 0, // 是否是预发测试环境
        isProd: envName.indexOf('prod') == 0, // 是否是生产环境
        withAll: envName.indexOf("-all") > 0 // 是否是打包所有
    },
    mRoot = pack.isDev ? "" : (pack.isTest ? "//www.t.ly.com" : "//www.ly.com"), // 中间层接口地址
    bRoot = pack.isDev ? "" : (pack.isTest ? "//train.t.17usoft.net" : "//train.17usoft.net"); // 后端接口地址

function getActivityPluginConfig() {
    var config = {
        projRoot: __dirname,
        serverDirName: projDirName,
        repServerRoot: "//file.40017.cn/huochepiao/activity/" + projDirName,
        repVersionReg: /_version_/ig,
        minifyHtml: true,
        htmlFiles: glob.sync("./*.html"),
        cssFiles: glob.sync("./css/*.css"),
        copyDirs: [],
        clearOutputPath: true,
        showLog: true
    };
    if (pack.withAll) {
        config.clearOutputPath = true;
        config.copyDirs = config.copyDirs.concat("./img");
    }
    return config;
}

function getEntrys(pattern = "./js/*.js") {
    var arr = glob.sync(pattern);
    var name, entrys = {};
    arr.map(val => {
        name = path.basename(val, '.js');
        entrys[name] = val;
    });
    return entrys;
};

var outputFilename = "js/[name].js";

if (!pack.isDev) outputFilename = "js/[name].[hash:8].js";

var config = {
    //插件项
    //plugins: [commonsPlugin],

    //页面入口文件配置，如果不需要页面自动刷新，可以开启下面这行，把后面的entry注释掉
    //entry: getEntrys(),
    entry: {
        index: "./js/index.js",
        applet: "./js/applet.js"
    },

    //入口文件输出配置
    output: {
        path: path.resolve(__dirname, './dist'),
        publicPath: 'dist/',
        filename: outputFilename
    },

    module: {
        //加载器配置
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
                loader: 'file-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]?[hash]'
                }
            }
            //,{ test: /\.(png|jpe?g)$/, loader: 'url-loader?limit=8192' }
        ]
    },

    //其它解决方案配置
    resolve: {
        //查找module的话从这里开始查找      
        //root: '', //绝对路径
        modules: ['./../', 'node_modules'],
        //自动扩展文件后缀名，意味着我们require模块可以省略不写后缀名
        //extensions: ['', '.js', '.json', '.scss'],
        //模块别名定义，方便后续直接引用别名，无须多写长长的地址
        alias: {

        }
    },
    devServer: {
        historyApiFallback: true,
        host: '10.101.70.86',
        port: 8081,
        //hot: true,
        inline: true,
        proxy: {
            '/uniontrainactivity/**': {
                target: 'http://www.t.ly.com',
                secure: false,
                changeOrigin: true
            },
            '/v3/marketsystem/**': {
                target: 'http://train.t.17usoft.net',
                secure: false,
                changeOrigin: true
            },
            '/trainoperationalactivity/**': {
                target: 'http://train.t.17usoft.net',
                secure: false,
                changeOrigin: true
            }
        }
    },
    performance: {
        hints: false
    }
};

if (pack.isDev) {
    config.devtool = "source-map";
}

module.exports = config;

module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: '"' + envName + '"',
            ProjDirName: '"' + projDirName + '"',
            MiddleRoot: '"' + mRoot + '"',
            BackRoot: '"' + bRoot + '"'
        }
    })]);

if (pack.isTest || pack.isProd) {
    // module.exports.devtool = '#source-map'
    // http://vue-loader.vuejs.org/en/workflow/production.html
    module.exports.plugins = (module.exports.plugins || []).concat([
        new webpack.optimize.UglifyJsPlugin({
            //sourceMap: true,
            compress: {
                warnings: false
            }
        }),
        new jPlugins.TcTrainActivityPlugin(getActivityPluginConfig()),
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ])
}
