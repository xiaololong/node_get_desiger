var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var mysql      = require('mysql');
//var crypto = require('crypto');

var connection = mysql.createConnection({
  host     : "192.168.0.61",
  user     : "xwq",
  password : "123456",
  database : 'tailornova_svg'
});
connection.connect();

var fs = require('fs');


var driver = new webdriver.Builder()
	.forBrowser('chrome')
	.build();

var getElement = function(xpath){
	sleep(1000)
	return driver.wait(until.elementLocated(By.xpath(xpath)), 50000000);
}

var sleep = function(numberMillis) { 
	var now = new Date(); 
	var exitTime = now.getTime() + numberMillis; 
	while (true) { 
		now = new Date(); 
		if (now.getTime() > exitTime) 
		return; 
	} 
}

async function scrollto1(index){
	sleep(5000)
	for(var i=0;i<10000;i+=200){
		js = "var q=document.getElementById('side_menu_content'); q.scrollBy(0,"+i+");"
		await driver.executeScript(js)	
		sleep(2000)
	}
}

async function scrollto(index){
	sleep(5000)
	var i = parseInt(index/6)*180;
	console.log("move",i)
	js = "var q=document.getElementById('side_menu_content'); q.scrollBy(0,"+i+");"
	await driver.executeScript(js)
	sleep(10000)
}	

async function scrolltoadd(index){
	var i = parseInt(index/6)*170;
	console.log("move",i)
	if(index%6==0){
		js = "var q=document.getElementById('side_menu_content'); q.scrollBy(0,"+i+");"
		await driver.executeScript(js)			
	}
	
}


async function getqun(qunchang_index,qun_index,ling_index){
	await getElement('//*[@id="app"]/div/div[6]/div/div[1]/div[1]/div/div[3]').click()
	//await getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[4]/div[1]').click()
	//await getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[4]/div[1]/div/div/div[2]/div[2]/div['+qunchang_index+']').click()
	await scrollto1(qun_index);
	const actions = driver.actions({bridge: true});
	await actions.click(getElement('//*[@id="side_menu_content"]/div['+qun_index+']')).click().perform();
	await getElement('//*[@id="app"]/div/div[6]/div/div[1]/div[1]/div/div[5]').click()
	
	
	try{
		await getqsvg(qunchang_index,qun_index,ling_index)
		console.log("the qun_index:"+qun_index)
	}catch(err){
		console.log(err)
	}finally{
		qun_index = qun_index+1
		await getqun(qunchang_index,qun_index,1)		
	}	
	
}



async function getqsvg(qunchang_index,qun_index,ling_index){

	await scrollto(ling_index);

	const actions = driver.actions({bridge: true});
	await actions.click(getElement('//*[@id="side_menu_content"]/div['+ling_index+']')).click().perform();

	//前面 后面切换
	await getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[1]/div[1]/div[2]').click()
	sleep(2000)
	//await scrolltoadd()
	//sleep(10000)	
	
	await setlog(qunchang_index,qun_index,ling_index);
	
	try{
		await getbacksvg(qunchang_index,qun_index,ling_index,1)
	}catch(err){
		console.log(err)
	}finally{
		const actions2 = driver.actions({bridge: true});
		await actions2.click(getElement('//*[@id="side_menu_content"]/div[1]')).click().perform();			
		
		
		ling_index = ling_index+1
		//切换到前面
		await getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[1]/div[1]/div[1]').click()
		sleep(2000)
		await getqsvg(qunchang_index,qun_index,ling_index)		
	}
	
		
}

async function getbacksvg(qunchang_index,qun_index,ling_index,back_index){
	
	await getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[1]/div[1]/div[2]').getAttribute("class").then(classs=>{
		if(classs != 'side_menu__tab active'){
			getElement('//*[@id="app"]/div/div[6]/div/div[2]/div[1]/div[1]/div[1]/div[2]').click()
		}
	})
	
	
	await scrolltoadd(back_index)
	
	const actions2 = driver.actions({bridge: true});
	await actions2.click(getElement('//*[@id="side_menu_content"]/div['+back_index+']')).click().perform();	
	console.log("the back_ling:"+back_index);
	
	//添加数据库
	await getsvg(qunchang_index,qun_index,ling_index,back_index);
	
	back_index = back_index+1;	
	await getbacksvg(qunchang_index,qun_index,ling_index,back_index)
}


async function getsvg(qunchang_index,qun_index,ling_index,back_index){
	sleep(2000)
	var qunnumid = await getlocaldata(34);
	var lingnumid = await getlocaldata(29);
	var backnumid = await getlocaldata(36);
	var previousElement = await getMd5();
	
	if(backnumid==undefined)
		return true;
	if(previousElement==undefined)
		previousElement = qunnumid;	
	
	console.log("previousElement,",previousElement)
	console.log("==============================")
	console.log(qunchang_index,qun_index,ling_index,back_index)
	try{
		getElement('//*[@class="area1-34"]').getAttribute("innerHTML").then(html=>{
			connection.query('select count(*) as c from silhouettes_'+qunchang_index+' where qun_id="'+qunnumid+'" and ling_id="'+lingnumid+'" and ling_back_id="'+backnumid+'"', function (error, results, fields) {
			  //if (error) throw error;
			  console.log('the data: ', results[0]['c']);
			  
			  if(results[0]['c']==0){
				 
					 connection.query("insert into silhouettes_"+qunchang_index+" set qun_id='"+qunnumid+"',ling_id='"+lingnumid+"',ling_back_id='"+backnumid+"',svg='"+html+"',previousElement='"+previousElement+"'") 
				  
			  }else{
				  console.log("data is exits ")
			  }
			});
		})
	}catch(err){
		 console.log(err) 
	}
	
}

async function getlocaldata(showindex){
	return driver.executeScript("var storage = window.localStorage;storage = storage.getItem('0.3.1'); storage = JSON.parse(storage);return storage;").then(locadatas=>{
		var localjson = locadatas['style']['styleElements'];
		for(var i in localjson){
		 if(localjson[i]['nodeId']==showindex){
			console.log(localjson[i]['id'])
		    return localjson[i]['id']
		 }
		}
		console.log("=======================")
	})
}

//获取md5
async function getMd5(){
	return driver.executeScript("var storage = window.localStorage;storage = storage.getItem('0.3.1'); storage = JSON.parse(storage);return storage;").then(locadatas=>{
		var localjson = locadatas['style']['styleElements'];
		for(var i in localjson){
		 if(localjson[i]['nodeId']==34){
			//var md5 = crypto.createHash('md5');
			return localjson[i]['previousElement'];
		 }
		}

	})	
}


//读取日志文件
async function getlog(qunchang_index){
	
	return fs.exists('D:/node/log_'+qunchang_index+'.log', function (exists) {
		if(exists){
			fs.readFile('D:/node/log_'+qunchang_index+'.log', {flag: 'r+', encoding: 'utf8'}, function (err, data) {
				data = data.split('_');
				console.log(data);
				getqun(parseInt(data[1]),parseInt(data[0]),parseInt(data[2]))
			});
			
		}else{
				getqun(qunchang_index,1,1)
		}
		
		
	});		
	

}

//写入文件
async function setlog(qunchang_index,qun_index,ling_index){
	var w_data = qun_index+'_'+qunchang_index+'_'+ling_index;
	fs.writeFile('D:/node/log_'+qunchang_index+'.log', w_data, {flag: 'w'}, function (err) {
	   if(err) {
			console.error(err);
		} else {
		   console.log('log is save');
		}
	})	
}


driver.manage().window().maximize(); 


(async function example() {
	try {
		await driver.get('https://tailornova.com/designer');
		await getElement('//*[@id="app"]/div/div[3]/div[1]/div[2]/div[4]/div').click()
		sleep(10000)
		await getElement('//*[@id="app"]/div/div[5]/div[4]/div[4]').click()
		await getElement('//*[@id="app"]/div/div[3]/div[1]/div[2]/form/div[5]/input').sendKeys('szqq7@qq.com')
		await getElement('//*[@id="app"]/div/div[3]/div[1]/div[2]/form/div[6]/input').sendKeys('123456')
		await getElement('//*[@id="app"]/div/div[3]/div[1]/div[2]/form/div[8]/div').click()
		sleep(10000)
		await getElement('//*[@id="app"]/div/div[5]/div[3]/button[3]').click()
		
		await getlog(3);

	}catch(err){
		console.log(err);
	} finally {
		//await driver.quit();
	}
})();
