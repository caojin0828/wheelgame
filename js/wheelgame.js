var myCanvas = document.getElementById('myCanvas');
var ctx = myCanvas.getContext('2d');
var leftWheel = null,//左小球
	rightWheel = null,//右小球
	wheelArr = [],//小球数组
	pointArr = [],//粒子数组
	isRun = null,//定时器
	frame = null,//帧实例
	creat = null,//定时回调函数
	$i = 0;//计数器
myCanvas.width = $(window).width();
myCanvas.height = $(window).height();

//16进制颜色转rgb
var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;  
String.prototype.colorRgb = function(){  
    var sColor = this.toLowerCase();  
    if(sColor && reg.test(sColor)){  
        if(sColor.length === 4){  
            var sColorNew = "#";  
            for(var i=1; i<4; i+=1){  
                sColorNew += sColor.slice(i,i+1).concat(sColor.slice(i,i+1));     
            }  
            sColor = sColorNew;  
        }  
        //处理六位的颜色值  
        var sColorChange = [];  
        for(var i=1; i<7; i+=2){  
            sColorChange.push(parseInt("0x"+sColor.slice(i,i+2)));    
        }  
        return "RGBA(" + sColorChange.join(",");  
    }else{  
        return sColor;    
    }  
}; 

window.onload = function(){
	//记录分数
	var maxNum = localStorage.getItem('maxNum') ? localStorage.getItem('maxNum') : 0;
	$('.game-score-maxNum').html(maxNum);
	
	//创建小球实例
	leftWheel = new Wheel({'color':'#f64d4d','left':225,'turn':'left'});
	rightWheel = new Wheel({'color':'#1bb9fb','left':525,'turn':'right'});
	wheelArr = [leftWheel,rightWheel];
	leftWheel.init();
	rightWheel.init();
	
	//创建粒子实例
	pointArr = [];
	for(var k=0;k<10;k++){
		pointArr[k] = new Point();
	}
	
	//创建帧实例
	frame = new Far();
	creat = function(){
		var thisLevel,levelBar,barObj,barrier,difftime,_time;
		thisLevel = gameLevel[frame.level];//当前关卡
		levelBar = thisLevel.barrierArr;//当前关卡障碍物数组
		barObj = levelBar[frame.count];//当前障碍物
		difftime = thisLevel.difftime;
		if(barObj){
			var option = {
				x : barObj.x,
				y : barObj.h * -1,
				w : barObj.w,
				h : barObj.h,
				s : thisLevel.dropSpeed
			}
			barrier = new Barrier(option);
			frame.count++;
			frame.barrier.push(barrier);
		}
		_time = Math.ceil(Number(frame.barrier[frame.barrier.length - 1].h)/thisLevel.dropSpeed);//障碍物高度通过时间
		return function res(){
			$i++;
			ctx.clearRect(0,0,myCanvas.width,myCanvas.height);
			for(var i=0;i<wheelArr.length;i++){
				if(wheelArr[i].isShow){
					wheelArr[i].init(wheelArr[i].turn);
				}
				if(!wheelArr[i].temp){
					wheelArr[i].rotate();
				}
			}
			if(_time && $i%(difftime +_time) == 0){
				$i = 0;
				isRun = requestAnimationFrame(creat());
			}else if(frame.barrier.length <= 0 && gameLevel[frame.level + 1]){
				frame.level++;
				frame.count = 0;
				$i = 0;
				$('.stage-num').html(frame.level + 1);
				$('.passStage').show();
				setTimeout(function(){
					$('.passStage').hide();
					isRun = requestAnimationFrame(creat());
				},3500);
			}else if(frame.barrier.length <= 0 && !gameLevel[frame.level + 1]){
				alert('恭喜您已通关，得分为'+$('.game-score-num').html());
			}else{
				isRun = requestAnimationFrame(res);
			}
			frame.star();
		}
	}
	creat()();
	
	//检测页面是否激活
	(function(){
		var hiddenProperty = 'hidden' in document ? 'hidden' :    
		    'webkitHidden' in document ? 'webkitHidden' :    
		    'mozHidden' in document ? 'mozHidden' :    
		    null;
		var visibilityChangeEvent = hiddenProperty.replace(/hidden/i, 'visibilitychange');
		var onVisibilityChange = function(){
		    if (!document[hiddenProperty]) {    
		        console.log('页面非激活');
		    }else{
		        console.log('页面激活');
		    }
		}
		document.addEventListener(visibilityChangeEvent, onVisibilityChange);
	})();
}

/*
 * 弹出层对象
 * */
var Confirm = {
	isShow : false,
	again : function(){
				this.isShow = false;
				$('.game-modal').hide();
				$('.container').css({'-webkit-filter' : 'none','filter': 'none'});
				$('.game-score-num').html(0);
				leftWheel.isShow = true;
				rightWheel.isShow = true;
				leftWheel.isbind = false;
				rightWheel.isbind = false;
				//删除所有障碍物
				for(var i=0;i<frame.barrier.length;i++){
					delete frame.barrier[i];
				}
				//初始化所有小粒子
				for(var k=0;k<10;k++){
					pointArr[k].opacity = 1;
					pointArr[k].x = null;
					pointArr[k].y = null;
				}
				frame.barrier = [];
				$i = 0;
				frame.count = 0;
				frame.level = 0;
				ctx.clearRect(0,0,myCanvas.width,myCanvas.height);
				creat()();
			}
};

/*
 * 小球
 * */
function Wheel(param){
	this.ctx = ctx;
	//旋转半径
	this.R = 3/7.5*$('.container').width()/2;
	//小球颜色
	this.color = param.color;
	//小球初始水平定位
	this.x = param.left;
	//小球初始垂直定位
	this.y = $('#myCanvas').height() - 220;
	this.r = 20;
	//旋转中小球水平定位
	this._x = this.x;
	//旋转中小球垂直定位
	this._y = this.y;
	//方位
	this.turn = param.turn;
	//当前是否触屏
	this.temp = true;
	//触屏水平位置
	this.startX = 0;
	//旋转角度
	this.deg = 0;
	//是否存在
	this.isShow = true;
	//事件绑定
	this.isbind = false;
	
	this.pathPos = 0;
}
Wheel.prototype = {
	init : function(){
		this.draw();
	},
	//画小球
	draw : function(){
		var that = this;
		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.arc(this._x,this._y,20,0,2*Math.PI,false);
		this.ctx.fill();
		this.ctx.closePath();
		if(this.isbind){
			return;	
		}else{
			this.isbind = true;
			$(window).on('touchstart',function(e){
				if(that.temp){
					that.temp = false;
					that.startX = e.originalEvent.targetTouches[0].pageX;
					that.touchEnd();
					that.rotate();
					return false;
				}
			})	
		}
	},
	//旋转
	rotate : function(){
		var that = this;
		var x = 0.4;
		if(that.startX >= $('.container').width()/2){//顺时针旋转
			that.deg -= Math.acos(Math.abs((that.R - x)/that.R));
		}else{//逆时针旋转
			that.deg += Math.acos(Math.abs((that.R - x)/that.R));
		}
		switch (that.turn){
			case 'left'://初始位置左侧小球运动轨迹
				that._x = that.x + that.R - that.R * Math.cos(that.deg);
				that._y = that.y + that.R * Math.sin(that.deg);
				break;
			case 'right'://初始位置右侧小球运动轨迹
				that._x = that.x - that.R + that.R * Math.cos(that.deg);
				that._y = that.y - that.R * Math.sin(that.deg);
				break;
			default:
				break;
		}
		
		that.pathPos += 0.1;
//		that.tail();
	},
	//拖尾
	tail : function(){
		var that = this;
		console.log(that.pathPos);
		ctx.beginPath();
	    ctx.fillStyle = 'rgba(28,27,32,0.15)';
	    ctx.fillRect(0, 0, innerWidth, innerHeight);
	    ctx.closePath();
	    ctx.beginPath();
	    ctx.fillStyle = this.color;
	    ctx.arc(that._x -that.pathPos, that._y -that.pathPos, 20, 0, Math.PI * 2, true);
	    ctx.fill();
	    ctx.closePath();
	},
	//旋转结束
	touchEnd : function(){
		var that = this;
		$(window).on('touchend',function(){
			that.temp = true;
			that.pathPos = 0;
		})
	}
}

/*
 * 障碍物对象
 * */
function Barrier(option){
	this.ctx = ctx;
	//障碍物水平定位
	this.x = option.x;
	//障碍物垂直定位
	this.y = option.y;
	//障碍物宽度
	this.w = option.w;
	//障碍物高度
	this.h = option.h;
	//是否存在
	this.isShow = true;
	//下落速度
	this.speed = option.s;
	//缩放
	this.scale = true;
	this.scaleNum = 1;
}
Barrier.prototype = {
	//画障碍物
	draw : function(){
		var ctx = this.ctx;
		ctx.save();
		ctx.beginPath();
		ctx.fillStyle = '#fff';
//		console.log(this.scaleNum);
		if(this.scale){
			this.scaleNum -= 0.001;
		}else{
			this.scaleNum += 0.001;
		}
//		console.log(this.scaleNum);
		ctx.fillRect(this.x,this.y,this.w,this.h);
		ctx.closePath();
		ctx.restore();
	},
	//障碍物下落
	drop : function(){
		if(this.scaleNum > 1.1 || this.scaleNum < 0.9){
			this.scale = !this.scale;
		}
		this.y += this.speed;
		this.draw();
	}
}

/*
 * 小粒子
 * */
function Point(callback){
	this.ctx = ctx;
	this.opacity = 1;
	this.deg = Math.random() * Math.PI * 2;
	this.callback = callback;
	//是否存在
	this.isShow = false;
}
Point.prototype = {
	init : function(x,y,color){
		this.x = this.x ? this.x : x;
		this.y = this.y ? this.y : y;
		this.r = 0;
		this.color = color.colorRgb() + ',' + this.opacity + ')';
		this.draw();
	},
	//渲染小粒子
	draw : function(){
		var randomNum = Math.random();
		this.r = randomNum*5+2;
		this.ctx.beginPath();
		this.ctx.fillStyle = this.color;
		this.ctx.arc(this.x,this.y,this.r,0,2*Math.PI,false);
		this.ctx.fill();
		this.ctx.closePath();
		this.move();
	},
	//小粒子运动
	move : function(){
		this.x += 3*Math.cos(this.deg);
		this.y += 3*Math.sin(this.deg)*Math.random();
		this.opacity = (this.opacity * 100 - 4).toFixed(0)/100;
		if(this.opacity <= 0){
			this.isShow = false;
			cancelAnimationFrame(isRun);
			if(!Confirm.isShow){
				var maxNum = localStorage.getItem('maxNum') ? localStorage.getItem('maxNum') : 0;
				var thisNum = Number($('.game-score-num').html());
				if(maxNum < thisNum){
					localStorage.setItem('maxNum',thisNum);
					$('.game-score-maxNum').html(thisNum);
					$('.game-confirm-txt').html('本次获得最高分!');
				}else{
					$('.game-confirm-txt').html('Game over !');
				}
				Confirm.isShow = true;
				$('.game-modal').fadeIn(300);
			}
			$('.container').css({'-webkit-filter' : 'blur(5px)','filter': 'blur(5px)'});
		}
	}
}

/*
 * 创建帧动画
 * */
var Far = function(){
	this.width = myCanvas.width;
	this.height = myCanvas.height;
	this.ctx = ctx;
	this.timer = null;
	//障碍物数量
	this.count = 0;
	//障碍物数组
	this.barrier = [];
	//关卡
	this.level = 0;
	//出局
	this.isOut = false;
}
Far.prototype = {
	star : function(){
		this.render();
	},
	//碰撞检测
	hit : function(b){
		var that = this;
		var len1 = wheelArr.length;
		var len2 = that.barrier.length;
		for(var i=0;i<len1;i++){
			var thisWheel = {
				x : wheelArr[i]._x - wheelArr[i].r,
				y : wheelArr[i]._y - wheelArr[i].r,
				w : wheelArr[i].r *2,
				h : wheelArr[i].r *2
			}
			if(!wheelArr[i].isShow){
				var pointLen = pointArr.length;
				for(var k=0;k<pointLen;k++){
					pointArr[k].isShow = true;
					pointArr[k].init(wheelArr[i]._x,wheelArr[i]._y,wheelArr[i].color);
				}
				break;
				return;
			}
			if(!b){
				that.barrier.shift();
				continue;
			}
			var thisBarrier = {
				x : b.x,
				y : b.y,
				w : b.w,
				h : b.h
			}
			var px = thisWheel.x <=  thisBarrier.x ? thisBarrier.x : thisWheel.x;
			var py = thisWheel.y <=  thisBarrier.y ? thisBarrier.y : thisWheel.y;
			if(px >= thisWheel.x 
				&& px <= thisWheel.x + thisWheel.w 
				&& py >= thisWheel.y 
				&& py <= thisWheel.y + thisWheel.h 
				&& px >= thisBarrier.x 
				&& px <= thisBarrier.x + thisBarrier.w 
				&& py >= thisBarrier.y 
				&& py <= thisBarrier.y + thisBarrier.h){
					wheelArr[i].isShow = false;
					$(window).off('touchstart');
					$(window).trigger('touchend');
					console.log('碰撞');
				}
		}
	},
	render : function(){
		var that = this;
		that.isOut = false;
		for(i in that.barrier){
			if(that.barrier[i].y <= myCanvas.height + 1){
				that.barrier[i].drop();
				that.hit(that.barrier[i]);
			}else{
				delete that.barrier[0];
				that.isOut = true;
			}
		}
		if(that.isOut){
			$('.game-score-num').html(Number($('.game-score-num').html()) + 10);
			that.barrier.shift();
		}
	}
}



