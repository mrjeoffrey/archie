//Top level code wrapper
function archieAPI(){
    /////////////////////////////////////////////////////////////////////////////
    //
    //https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en
    //
    /*
    Function for extending objects. The PROTOTYPE properties are duplicated in the child, 
    and the PROTOTYPE methods are passed as reference. Usage:
            function p(){};
            function c(){};
            extendObject(p,c);
            var cInst = new c();
    */
    function extendObject(pParent,pChild) {
            var p = pParent.prototype;
            var c = pChild.prototype;
            for(var i in p){
                    c[i] = p[i];
            }
            c.uber = p;
    };
    /*
        Function that performs a deep copy - primitive types and objects
    */
    function deepCopy(pParent,pChild) {
            var pChild =  pChild || {};
            for(var i in pParent){
                    if(typeof pParent[i] === 'object'){
                            pChild[i] = (pParent[i].constructor === Array) ? [] : {};
                            deepCopy(pParent[i],pChild[i]);
                    }
                    else {
                            pChild[i]=pParent[i];
                    }
            }
            return pChild;
    };
    /*
    Deep copy using the jQuery:
            var newObject = jQuery.extend(true, {}, oldObject);
    */
   /////////////////////////////////////////////////////////////////////////////
   /*
    * An object to hold relevant data about the loaded entry data from the excel file
    * @returns {archieAPI.Entry}
    */
    function Entry(){
        this.date=null;
        this.title=null;
        this.topic=null;
        this.imageURL=null;
        this.topicURL=null;
        this.image=null;
        this.articleType=null;
        this.orgImage=null;
        this.ID=null;
        this.saved=false;
    };
    //An array of the Entry objects
    var loadedEntries = [];
    
    //The global scale stage
    var scaleStage = null;
    
    //The global image quality number
    this.imageQuality = 0.5;

    this.windowTemplate={
        subjectWidth:610,
        subjectHeight:610,
        x:'auto',
        y:48,//was 65
        blur:10
    };
    this.contentBoxTemplate={
        alpha:0.8,
        backcolor:'#000000',
        textcolor:'#ffffff'
    };
    this.gradientTemplate={
        topalpha:1.0,
        bottomalpha:1.0,
        color1:'',
        color2:'rgba(255,255,255,0)',
        topratio1:0,
        topratio2:0.1,
        bottomratio1:0.1,
        bottomratio2:0.5
    };
    
    this.rayLightInterval = null;
    this.startRays=function(){
        try{
            $('#celeb_control').html('Stop the celebration');
            $('#celeb_control').attr('onclick','jArchie.stopRays();');
            for(var i=0;i<20;i++){
                var ray = document.createElement('div');
                    ray.setAttribute('class','ray');
                    ray.style.width=ray.style.height=Math.random()*40;
                document.getElementById('raylight_container').appendChild(ray);
            }
            $('#raylight_container').css('z-index',1040);
            this.rayLightInterval=setInterval(function(){
                $('.ray').each(function(){
                    $(this).css('left',Math.random() * window.innerWidth-200);        
                    $(this).css('top',Math.random() * window.innerHeight-200);
                    $(this).css('background-color','rgb('+(Math.round(Math.random()*255))+','+(Math.round(Math.random()*255))+','+(Math.round(Math.random()*255))+')');
                    var randD = Math.random() * 40;
                    $(this).css('width',randD);
                    $(this).css('height',randD);
                        });        
            },2000);
        }
        catch(e){}
    };
    this.stopRays=function(){
        try{
            clearInterval(this.rayLightInterval);
            $('#raylight_container').html('');
            $('#raylight_container').css('z-index',0);
            $('#celeb_control').html('Start the celebration again!');
            $('#celeb_control').attr('onclick','jArchie.startRays();');
        }
        catch(e){}
    };
    
    //when the mouse is cliked over the stage offset relative to the image is determined
    //and saved for the move event
    this.offset=null;
    
    //Global ZIP file
    var ZIP = new JSZip();
    //A global variable that is the ID of the currently loaded Entry
    //The var is set to a String and a cast to int is required when doing aritmethic
    var currentEntryID = 0;
    //Display parameters for the toastr library
    toastr.options = {
        "closeButton": true,
        "positionClass": "toast-top-center",
        "preventDuplicates": true,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "4000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    ////////////////////////////////////////////////////////////////////////////////////
    /*
        Definitions of the objects used on the stage.
    */	
    this.jStageObjects = new function(){
            //Basic shape object for the stage. Its prototype contains the basic properties for the Shape, Container and Text objects
            this.jStageShape = function(){};
                    //The object that will be used in all extended classes as the one to be added to the stage
                    this.jStageShape.prototype.stageObject = null;
                    this.jStageShape.prototype.name='';
                    this.jStageShape.prototype.zIndex=0;
                    this.jStageShape.prototype.addToStage=function(){
                            if(this.stageObject!=null && this.stageObject!=false && this.stageObject!=undefined){
                                    try{
                                            stage.addChild(this.stageObject);
                                            stage.setChildIndex(stage.getChildByName(this.name),this.zIndex);
                                            stage.update();
                                            console.log('---------> AN OBJECT HAS BEEN ADDED TO STAGE: '+this.name);
                                    }
                                    catch(e){return false;}
                            }
                            else{return false;}
                            return true;
                    };
                    this.jStageShape.prototype.enableDrag=function(){
                        try{
                            this.stageObject.on('mousedown',function(evt){
                                jArchie.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
                            });
                            this.stageObject.on("pressmove",function(evt) {
                                this.x = (evt.stageX + jArchie.offset.x);
                                this.y = (evt.stageY + jArchie.offset.y);
                                stage.update();   
                            });
                        }
                        catch(e){
                            console.log('ERROR - An error occured while enabling the drag feature: '+e.toString());
                            toastr.warning('Drag feature could not be enabled on '+this.name);
                        }
                    };
            //Object to hold the rectangle shape. The basic extended classes are the gradientFill and fill rectangles.
            this.jStageRectange = function(){};
                    this.jStageRectange.prototype.radius=null;//corner radius - integer
                    //Creates the Shape object and assigns the attributes.
                    this.jStageRectange.prototype.createRectShape=function(){
                            try{
                                this.stageObject = new createjs.Shape();
                            }
                            catch(e){this.stageObject=null;return false;}
                            return true;
                    };
            //The fill rectangle object.
            this.jFillRectange = function(pName,pZIndex,pColor,pX,pY,pWidth,pHeight){
                    this.name=pName;
                    this.zIndex=pZIndex;
                    //Function to be called when creating the fillRectangle.
                    this.createFillRect = function(pColor,pX,pY,pWidth,pHeight){
                            try{
                                    if(this.createRectShape()){
                                            this.stageObject.graphics.beginFill(pColor).drawRect(pX,pY,pWidth,pHeight);
                                            this.stageObject.name=this.name;
                                    }
                                    else{this.stageObject=null;return false;}	
                            }
                            catch(e){this.stageObject=null;return false;}
                            return true;
                    };
                    this.createFillRect(pColor,pX,pY,pWidth,pHeight);
            };
            //The gradient fill rectange
            this.jGradientFillRectange=function(pName,pZIndex,pColor1,pColor2,pGradRatio1,pGradRatio2,pGradX0,pGradY0,pGradX1,pGradY1,pX,pY,pWidth,pHeight){
                    this.name=pName;
                    this.zIndex=pZIndex;
                    this.createGradFillRect = function(pColor1,pColor2,pGradRatio1,pGradRatio2,pGradX0,pGradY0,pGradX1,pGradY1,pX,pY,pWidth,pHeight){
                            try{
                                    if(this.createRectShape()){
                                            this.stageObject.graphics.beginLinearGradientFill([pColor1,pColor2],[pGradRatio1,pGradRatio2],pGradX0,pGradY0,pGradX1,pGradY1).drawRect(pX,pY,pWidth,pHeight);
                                            this.stageObject.name=this.name;
                                    }
                                    else{this.stageObject=null;return false;}	
                            }
                            catch(e){this.stageObject=null;return false;}
                            return true;
                    };
                    this.createGradFillRect(pColor1,pColor2,pGradRatio1,pGradRatio2,pGradX0,pGradY0,pGradX1,pGradY1,pX,pY,pWidth,pHeight);
            };
            //Extending the Shape to fillRectangle
            extendObject(this.jStageShape,this.jStageRectange);
            extendObject(this.jStageRectange,this.jFillRectange);
            extendObject(this.jStageRectange,this.jGradientFillRectange);
            //The image object
            this.jImage = function(pName,pZIndex,pPath,pX,pY){
                    this.name = pName;
                    this.zIndex = pZIndex;
                    this.posX=pX;
                    this.posY=pY;
                    this.createImage=function(pName,pZIndex,pPath,pX,pY){
                            try{
                                var canvasImageQueue = new createjs.LoadQueue(false);
                                    canvasImageQueue.on("complete", function(){
                                        console.log('\t'+'----> Image load queue done');
                                        try{
                                            var limage = canvasImageQueue.getResult("canvas_img");
                                            this.stageObject = new createjs.Bitmap(limage);
                                            this.stageObject.name='imagery';
                                            stage.addChild(this.stageObject);
                                            this.enableDrag();
                                            console.log('\t\t'+'Image added to the stage.');
                                                this.stageObject.x=0;
                                                this.stageObject.y=0;
                                            stage.setChildIndex(this.stageObject,1);
                                            stage.update();
                                            jArchie.selectType($('#select_template').val());
                                            if($('#chkbox_fullScreenDefault').prop('checked')===true){
                                                jArchie.setFullScreenImage();
                                            }
                                        }
                                        catch(e){
                                            toastr.error('An error occured while displaying the image. Check the log:');
                                            console.log('ERROR - An error on jImage creation occured: '+e.toString());
                                        }
                                        
                                    },this);
                                    var requestPath = '';
                                    if($('#chkBox_corsProxy').attr('class')==='entypo-check'){
                                        requestPath = 'http://www.corsproxy.com/'+pPath.substring(pPath.indexOf('//')+2,pPath.length);
                                        console.log('\t'+'----> Image load queue start on src: '+requestPath);
                                        canvasImageQueue.loadFile({id:'canvas_img',src:requestPath});
                                    }
                                    else{
                                        requestPath = pPath;
                                        console.log('\t'+'----> Image load queue start on src: '+requestPath);
                                        canvasImageQueue.loadFile({id:'canvas_img',src:requestPath});
                                    }
                            }
                            catch(e){this.stageObject=null;return false;}
                            return true;
                    };
                    this.createImage(this.name,this.zIndex,pPath,pX,pY);
                    //this.loadImage(pPath);
            };
            //Extending to jImage
            extendObject(this.jStageShape,this.jImage);
            this.jText=function(pName,pZIndex,pText,pColor,pSize,pStyle,pWeight,pFontFamily,pAlign,pX,pY){
                    this.name=pName;
                    this.zIndex=pZIndex;
                    this.createText=function(pText,pColor,pSize,pStyle,pWeight,pFontFamily,pAlign,pX,pY){
                            try{
                                this.stageObject = new createjs.Text();
                                this.stageObject.name=this.name;
                                this.stageObject.textAlign=pAlign;
                                this.stageObject.color=pColor;
                                this.stageObject.font=pStyle+' '+pWeight+' '+pSize+'px "'+pFontFamily+'"';
                                this.stageObject.text=pText;
                                this.stageObject.x=pX;
                                this.stageObject.y=pY;
                            }
                            catch(e){this.stageObject=null;return false;}
                            return true;
                    };
                    this.createText(pText,pColor,pSize,pStyle,pWeight,pFontFamily,pAlign,pX,pY);
            };
            extendObject(this.jStageShape,this.jText);
    };
    ////////////////////////////////////////////////////////////////////////////
    this.jObjectEditor = new function(){
        this.currentEditorWindow = null;
        
        this.editor = function(){};
            this.editor.prototype.windowContent=null;
            this.editor.prototype.colpickAPI=null;
            this.editor.prototype.newEditor=function(pWidth,pHeight,pTitle,pContent){
                $.Dialog({
                    shadow: true,
                    overlay: false,
                    draggable: true,
                    width: pWidth,
                    height: pHeight,
                    padding: 10,
                    title: pTitle,
                    overlayClickClose:false,
                    content: '',
                    onShow: function(){
                        var content = pContent;
                        $.Dialog.content(content);
                    }
                });
            };
            this.editor.prototype.setWindowTemplate=function(){
                try{
                    jArchie.windowTemplate.subjectWidth=$('#txt_WTE_width').val();
                    jArchie.windowTemplate.subjectHeight=$('#txt_WTE_height').val();
                    jArchie.windowTemplate.x=$('#txt_WTE_x').val();
                    jArchie.windowTemplate.y=$('#txt_WTE_y').val();
                    $('.btn-close').click();
                }
                catch(e){
                    console.log('ERROR - An error occured while setting up the window template from the editor: '+e.toString());
                    toastr.warning('The window template could not be set-up. Check the log.');
                }
            };
            this.editor.prototype.resetWindowTemplate=function(){
                try{
                    $('#txt_WTE_width').val(610);
                    $('#txt_WTE_height').val(610);
                    $('#txt_WTE_x').val('auto');
                    $('#txt_WTE_y').val(65);
                    $('#sliderWTE_blur').slider('value',5);
                }
                catch(e){
                    console.log('ERROR - An error occured while reseting the window template from the editor: '+e.toString());
                    toastr.warning('The window template could not be reset. Check the log.');
                }
            };
            this.editor.prototype.setUpGradientEditor=function(){
                $('#sliderGEW_topalpha').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.topalpha*100,
                    change:function(){
                        if(stage.getChildIndex(stage.getChildByName('gradienttop'))!==-1){
                            stage.getChildByName('gradienttop').alpha=$('#sliderGEW_topalpha').slider('value')/100;
                            stage.update();
                        }
                }});
                $('#sliderGEW_bottomalpha').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.bottomalpha*100,
                    change:function(){    
                        if(stage.getChildIndex(stage.getChildByName('gradientbottom'))!==-1){
                            stage.getChildByName('gradientbottom').alpha=$('#sliderGEW_bottomalpha').slider('value')/100;
                            stage.update();
                        }
                }});
                $('#sliderGEW_ratiotop1').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.topratio1*100,
                    change:function(){
                        if(stage.getChildIndex(stage.getChildByName('gradientbottom'))!==-1){
                            jArchie.jObjectEditor.currentEditorWindow.changeGradientRatios();
                        }
                    }
                });
                $('#sliderGEW_ratiotop2').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.topratio2*100,
                    change:function(){
                        if(stage.getChildIndex(stage.getChildByName('gradientbottom'))!==-1){
                            jArchie.jObjectEditor.currentEditorWindow.changeGradientRatios();
                        }
                    }
                });
                $('#sliderGEW_ratiobottom1').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.bottomratio1*100,
                    change:function(){
                        if(stage.getChildIndex(stage.getChildByName('gradientbottom'))!==-1){
                            jArchie.jObjectEditor.currentEditorWindow.changeGradientRatios();
                        }
                    }
                });
                $('#sliderGEW_ratiobottom2').slider({
                    min:0,
                    max:100,
                    position:jArchie.gradientTemplate.bottomratio2*100,
                    change:function(){
                        if(stage.getChildIndex(stage.getChildByName('gradientbottom'))!==-1){
                            jArchie.jObjectEditor.currentEditorWindow.changeGradientRatios();
                        }
                    }
                });
                $('#GEW_colorpicker1').colpick({
                    flat:true,
                    leyout:'hex',
                    submit:0,
                    color:jArchie.gradientTemplate.color1.substring(1)+'',
                    onChange:function(hsb,hex,rgb,el,bySetColor){
                        if(stage.getChildIndex(stage.getChildByName('gradienttop'))!==-1){
                            stage.removeChild(stage.getChildByName('gradientbottom'));
                            stage.removeChild(stage.getChildByName('gradienttop'));
                            stage.update();
                            var gradBottom = new jArchie.jStageObjects.jGradientFillRectange('gradientbottom',3,'#'+hex,'rgba(255, 255, 255, 0)',$('#sliderGEW_ratiobottom1').slider('value')/100,$('#sliderGEW_ratiobottom2').slider('value')/100,360,1230,360,0,0,0,720,1230);
                            gradBottom.stageObject.alpha=$('#sliderGEW_bottomalpha').slider('value')/100;
                            gradBottom.addToStage();
                            var gradTop = new jArchie.jStageObjects.jGradientFillRectange('gradienttop',2,'#'+hex,'rgba(255, 255, 255, 0)',$('#sliderGEW_ratiotop1').slider('value')/100,$('#sliderGEW_ratiotop2').slider('value')/100,360,0,360,1230,0,0,720,1230);
                            gradTop.stageObject.alpha=$('#sliderGEW_topalpha').slider('value')/100;
                            gradTop.addToStage();
                        }
                }
            });
            };
            this.editor.prototype.changeGradientRatios=function(){
                if(stage.getChildIndex(stage.getChildByName('gradienttop'))!==-1){
                    stage.removeChild(stage.getChildByName('gradientbottom'));
                    stage.removeChild(stage.getChildByName('gradienttop'));
                    stage.update();
                    var gradBottom = new jArchie.jStageObjects.jGradientFillRectange('gradientbottom',3,'#'+$('#colpick_colorHexValue_465').val(),'rgba(255, 255, 255, 0)',$('#sliderGEW_ratiobottom1').slider('value')/100,$('#sliderGEW_ratiobottom2').slider('value')/100,360,1230,360,0,0,0,720,1230);
                        gradBottom.stageObject.alpha=$('#sliderGEW_bottomalpha').slider('value')/100;
                        gradBottom.addToStage();
                    var gradTop = new jArchie.jStageObjects.jGradientFillRectange('gradienttop',2,'#'+$('#colpick_colorHexValue_465').val(),'rgba(255, 255, 255, 0)',$('#sliderGEW_ratiotop1').slider('value')/100,$('#sliderGEW_ratiotop2').slider('value')/100,360,0,360,1230,0,0,720,1230);
                        gradTop.stageObject.alpha=$('#sliderGEW_topalpha').slider('value')/100;
                        gradTop.addToStage();
                }
            };
            this.editor.prototype.saveGradientEditorSettings=function(){
                jArchie.gradientTemplate.topalpha=$('#sliderGEW_topalpha').slider('value');
                jArchie.gradientTemplate.bottomalpha=$('#sliderGEW_bottomalpha').slider('value');
                jArchie.gradientTemplate.topratio1=$('#sliderGEW_ratiotop1').slider('value');
                jArchie.gradientTemplate.topratio2=$('#sliderGEW_ratiotop2').slider('value');
                jArchie.gradientTemplate.bottomratio1=$('#sliderGEW_ratiobottom1').slider('value');
                jArchie.gradientTemplate.bottomratio2=$('#sliderGEW_ratiobottom2').slider('value');
            };
            this.editor.prototype.resetGradientEditorSettings=function(){
                $('#sliderGEW_topalpha').slider('value',60);
                $('#sliderGEW_bottomalpha').slider('value',60);
                $('#sliderGEW_ratiotop1').slider('value',0);
                $('#sliderGEW_ratiotop2').slider('value',30);
                $('#sliderGEW_ratiobottom1').slider('value',0);
                $('#sliderGEW_ratiobottom2').slider('value',50);
            };
        
        this.contentBoxEditor=function(pWidth,pHeight,pTitle){
            this.windowContentA = [];
                this.windowContentA.push("<h4>Transparency</h4>");
                this.windowContentA.push('<div id="sliderCBE_alpha" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
                this.windowContentA.push("<h4>Background color</h4>");
                this.windowContentA.push('<div id="CBE_colorpicker1"></div>');
                this.windowContentA.push("<h4>Text color</h4>");
                this.windowContentA.push('<div id="CBE_colorpicker2"></div>');
                this.windowContentA.push("<script>");
                    this.windowContentA.push("$('#sliderCBE_alpha').slider({range:'min',min:0,max:100,position:"+Math.round(jArchie.contentBoxTemplate.alpha*100)+",change:function(event,ui){");
                        this.windowContentA.push("var sliderValue = $('#sliderCBE_alpha').slider('value');");
                        this.windowContentA.push("stage.getChildByName('contentbox').alpha=sliderValue/100;");
                        this.windowContentA.push("stage.update();");
                    this.windowContentA.push("}});");
                    this.windowContentA.push("$('#CBE_colorpicker1').colpick({flat:true,layout:'hex',submit:0,color:'"+jArchie.contentBoxTemplate.backcolor.substring(1)+"',onChange:function(hsb,hex,rgb,el,bySetColor){stage.getChildByName('contentbox').graphics.clear().beginFill('#'+hex).drawRect(56,713,608,253);stage.update();}});");
                    this.windowContentA.push("$('#CBE_colorpicker2').colpick({flat:true,layout:'hex',submit:0,color:'"+jArchie.contentBoxTemplate.textcolor.substring(1)+"',onChange:function(hsb,hex,rgb,el,bySetColor){stage.getChildByName('contenttext').color='#'+hex;stage.update();}});");
                this.windowContentA.push("</script>");
            jArchie.jObjectEditor.currentEditorWindow = new jArchie.jObjectEditor.editor();
            jArchie.jObjectEditor.currentEditorWindow.newEditor(pWidth,pHeight,pTitle,this.windowContentA.join(""));
        };   
        
        this.imageQualityEditor=function(pWidth,pHeight,pTitle){
            this.windowContentA = [];
                this.windowContentA.push("<h4>Image quality</h4>");
                this.windowContentA.push('<div id="sliderIQE_quality" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
                this.windowContentA.push('<label>Approximate image size</label><span id="iqe_imageSize"></span>KB');
                this.windowContentA.push("<script>");
                    this.windowContentA.push('var IQEimageSize = jArchie.getImageSize();');
                    this.windowContentA.push('$("#iqe_imageSize").html(IQEimageSize);');
                    this.windowContentA.push("$('#sliderIQE_quality').slider({range:'min',min:0,max:100,position:Math.round(jArchie.imageQuality*100),change:function(event,ui){");
                        this.windowContentA.push("var sliderValue = $('#sliderIQE_quality').slider('value');");
                        this.windowContentA.push("jArchie.imageQuality=sliderValue/100;");
                        this.windowContentA.push("var imagesize = jArchie.getImageSize();");
                        this.windowContentA.push('$("#iqe_imageSize").html(imagesize);');
                    this.windowContentA.push("}});");
                this.windowContentA.push("</script>");
            this.windowContent=this.windowContentA.join("");
            this.newEditor(pWidth,pHeight,pTitle,this.windowContent);
        };
        
        this.windowTemplateEditor=function(pWidth,pHeight,pTitle){
            this.windowContentA = [];
            this.windowContentA.push("<h4>Window dimensions</h4>");
            this.windowContentA.push("<label>Width</label>");
            this.windowContentA.push("<div class='input-control text size1' data-role='input-control'>");
            this.windowContentA.push("<input type='text' id='txt_WTE_width' value='"+jArchie.windowTemplate.subjectWidth+"'>");
            this.windowContentA.push("</div>");
            this.windowContentA.push("<label>Height</label>");
            this.windowContentA.push("<div class='input-control text size1' data-role='input-control'>");
            this.windowContentA.push("<input type='text' id='txt_WTE_height' value='"+jArchie.windowTemplate.subjectHeight+"'>");
            this.windowContentA.push("</div>");
            this.windowContentA.push("<label>x</label>");
            this.windowContentA.push("<input type='text' id='txt_WTE_x' value='"+jArchie.windowTemplate.x+"'>");
            this.windowContentA.push("<label>y</label>");
            this.windowContentA.push("<input type='text' id='txt_WTE_y' value='"+jArchie.windowTemplate.y+"'>");
            this.windowContentA.push("<label>Blur (px)</label>");
            this.windowContentA.push('<div id="sliderWTE_blur" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<button onclick='jArchie.jObjectEditor.currentEditorWindow.setWindowTemplate();' class='default'>Save</button>");
            this.windowContentA.push("<button onclick='jArchie.jObjectEditor.currentEditorWindow.resetWindowTemplate();' class='default'>Reset</button>");
            this.windowContentA.push("<script>");
                this.windowContentA.push("$('#sliderWTE_blur').slider({range:'min',min:0,max:50,position:"+jArchie.windowTemplate.blur+",change:function(event,ui){");
                    this.windowContentA.push("var sliderValue = $('#sliderWTE_blur').slider('value');");
                    this.windowContentA.push("jArchie.windowTemplate.blur=sliderValue;");
                this.windowContentA.push("}});");
            this.windowContentA.push("</script>");
            jArchie.jObjectEditor.currentEditorWindow = new jArchie.jObjectEditor.editor();
            jArchie.jObjectEditor.currentEditorWindow.newEditor(pWidth,pHeight,pTitle,this.windowContentA.join(""));
        };
        
        this.gradientEditor=function(pWidth,pHeight,pTitle){
            this.windowContentA = [];
            this.windowContentA.push("<h4>Gradient options</h4>");
            this.windowContentA.push("<label>Color 1</label>");
            this.windowContentA.push("<div id='GEW_colorpicker1'></div>");
            this.windowContentA.push("<label>Alpha top</label>");
            this.windowContentA.push('<div id="sliderGEW_topalpha" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<label>Ratio 1 top</label>");
            this.windowContentA.push('<div id="sliderGEW_ratiotop1" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<label>Ratio 2 top</label>");
            this.windowContentA.push('<div id="sliderGEW_ratiotop2" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<label>Alpha bottom</label>");
            this.windowContentA.push('<div id="sliderGEW_bottomalpha" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<label>Ratio 1 bottom</label>");
            this.windowContentA.push('<div id="sliderGEW_ratiobottom1" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<label>Ratio 2 bottom</label>");
            this.windowContentA.push('<div id="sliderGEW_ratiobottom2" class="slider permanent-hint" data-marker-color="#999999"  data-complete-color="#2f96b4" data-show-hint="true"></div>');
            this.windowContentA.push("<button onclick='jArchie.jObjectEditor.currentEditorWindow.saveGradientEditorSettings();' class='default'>Save</button>");
            this.windowContentA.push("<button onclick='jArchie.jObjectEditor.currentEditorWindow.resetGradientEditorSettings();' class='default'>Reset</button>");
            jArchie.jObjectEditor.currentEditorWindow = new jArchie.jObjectEditor.editor();
            jArchie.jObjectEditor.currentEditorWindow.newEditor(pWidth,pHeight,pTitle,this.windowContentA.join(""));
            jArchie.jObjectEditor.currentEditorWindow.setUpGradientEditor();
        };
   
        extendObject(this.editor,this.imageQualityEditor);
    };
    ////////////////////////////////////////////////////////////////////////////
    this.jImageCrop = new function(){
        this.currentCropWindow = null;       
        
        this.cropWindow = function(){};
            this.cropWindow.prototype.windowContent=null;
            this.cropWindow.prototype.offset=null;
            this.cropWindow.prototype.beforeContent=null;
            this.cropWindow.prototype.afterContent=null;
            this.cropWindow.prototype.jCropAPI=null;
            this.cropWindow.prototype.cropWindowCrop=function(){
                try{
                    var sc =document.getElementById("scale_canvas");
                    var IMGDATA = sc.toDataURL();
                    var newimage = new Image();
                        newimage.onload=function(){
                            stage.getChildByName('imagery').image=newimage;
                            stage.update();
                            jArchie.setWindowImage();
                            $('.btn-close').click();
                        };
                        newimage.src=IMGDATA;
                }
                catch(e){
                    console.log('ERROR - An error occured while updating the stage imagery after the window crop: '+e.toString());
                    toastr.error('The crop could not be performed');
                    $('.btn-close').click();
                }
            };
            this.cropWindow.prototype.cropImage=function(){
                var w = $('#cropWindow_widthText').val();
                var h = $('#cropWindow_heightText').val();
                var x = $('#cropWindow_xText').val();
                var y = $('#cropWindow_yText').val();
                var imageToBeCroped = scaleStage.getChildByName('scaleimage');
                    imageToBeCroped.sourceRect=new createjs.Rectangle(x,y,w,h);
                var tempCanvas = document.createElement('canvas');
                    tempCanvas.width=w;
                    tempCanvas.height=h;
                
                scaleStage.update();
                try{
                    stage.getChildByName('imagery').sourceRect=new createjs.Rectangle(x,y,w,h);
                    stage.update();
                    $('.btn-close').click();
                }
                catch(e){
                    console.log('ERROR - An error while applying the crop: '+e.toString());
                    toastr.warning('The crop could not be applied');
                }
            };
            this.cropWindow.prototype.newCropWindow=function(pImage,pContent){
                $.Dialog({
                    shadow: true,
                    overlay: false,
                    width: 1100,
                    height: 500,
                    padding: 5,
                    overlayClickClose:false,
                    content: '',
                    onShow: function(){
                        var content = pContent;
                        $.Dialog.content(content);
                        var scalew = 1;
                        var scaleh = 1;
                        var scale = 1;
                        if(pImage.height>510 || pImage.width>510){
                            scaleh= 510/pImage.height;
                            scalew= 510/pImage.width;
                            if(scaleh<scalew){
                                scale=scaleh;
                                $('#cropWindow_canvasHolder').append('<canvas style="border:1px solid black;" id="scale_canvas" width="'+Math.floor(pImage.width*scaleh)+'" height="'+Math.floor(pImage.height*scaleh)+'">');
                            }
                            else{
                                scale=scalew;
                                $('#cropWindow_canvasHolder').append('<canvas style="border:1px solid black;" id="scale_canvas" width="'+Math.floor(pImage.width*scalew)+'" height="'+Math.floor(pImage.height*scalew)+'">');
                            }
                        }
                        else{
                            $('#cropWindow_canvasHolder').append('<canvas style="border:1px solid black;" id="scale_canvas" width="'+pImage.width+'" height="'+pImage.height+'">');
                        }
                        console.log('Crop window canvas scale: '+scale);
                        scaleStage = new createjs.Stage(document.getElementById('scale_canvas'));
                        scaleStage.scaleX=scale;
                        scaleStage.scaleY=scale;
                        
                        var scaleBackground= new createjs.Shape();
                            scaleBackground.graphics.beginFill('#ffffff').drawRect(0,0,$('#scale_canvas').attr('width')/scale,$('#scale_canvas').attr('height')/scale);
                        scaleStage.addChild(scaleBackground);
                        scaleStage.setChildIndex(scaleBackground,0);

                        var imgBmp = new createjs.Bitmap(pImage);
                            imgBmp.x=0;
                            imgBmp.y=0;
                            imgBmp.name='scaleimage';
                        scaleStage.addChild(imgBmp);
                        scaleStage.setChildIndex(imgBmp,1);
                        scaleStage.update();
                        $('#cropWindow_widthText').change(function(){
                            try{
                                var x = parseInt($('#cropWindow_xText').val());
                                var y = parseInt($('#cropWindow_yText').val());
                                var w = parseInt($('#cropWindow_widthText').val());
                                var h = parseInt($('#cropWindow_heightText').val());
                                jArchie.jImageCrop.currentCropWindow.jCropAPI.setSelect([x*scaleStage.scaleX,y*scaleStage.scaleX,(x+w)*scaleStage.scaleX,(y+h)*scaleStage.scaleX]);
                            }
                            catch(e){
                                console.log('ERROR - An error occured while changing the selection width value: '+e.toString());
                                toastr.warning('UPS!');
                            }
                        });
                        $('#cropWindow_heightText').change(function(){
                            try{
                                var x = parseInt($('#cropWindow_xText').val());
                                var y = parseInt($('#cropWindow_yText').val());
                                var w = parseInt($('#cropWindow_widthText').val());
                                var h = parseInt($('#cropWindow_heightText').val());
                                jArchie.jImageCrop.currentCropWindow.jCropAPI.setSelect([x*scaleStage.scaleX,y*scaleStage.scaleX,(x+w)*scaleStage.scaleX,(y+h)*scaleStage.scaleX]);
                            }
                            catch(e){
                                console.log('ERROR - An error occured while changing the selection width value: '+e.toString());
                                toastr.warning('UPS!');
                            }
                        });
                        $('#cropWindow_xText').change(function(){
                            try{
                                var x = parseInt($('#cropWindow_xText').val());
                                var y = parseInt($('#cropWindow_yText').val());
                                var w = parseInt($('#cropWindow_widthText').val());
                                var h = parseInt($('#cropWindow_heightText').val());
                                jArchie.jImageCrop.currentCropWindow.jCropAPI.setSelect([x*scaleStage.scaleX,y*scaleStage.scaleX,(x+w)*scaleStage.scaleX,(y+h)*scaleStage.scaleX]);
                            }
                            catch(e){
                                console.log('ERROR - An error occured while changing the selection width value: '+e.toString());
                                toastr.warning('UPS!');
                            }
                        });
                        $('#cropWindow_yText').change(function(){
                            try{
                                var x = parseInt($('#cropWindow_xText').val());
                                var y = parseInt($('#cropWindow_yText').val());
                                var w = parseInt($('#cropWindow_widthText').val());
                                var h = parseInt($('#cropWindow_heightText').val());
                                jArchie.jImageCrop.currentCropWindow.jCropAPI.setSelect([x*scaleStage.scaleX,y*scaleStage.scaleX,(x+w)*scaleStage.scaleX,(y+h)*scaleStage.scaleX]);
                            }
                            catch(e){
                                console.log('ERROR - An error occured while changing the selection width value: '+e.toString());
                                toastr.warning('UPS!');
                            }
                        });
                        $('#scale_canvas').Jcrop(
                                {
                            addClass: 'jcrop-dark',
                            onChange: function(pCoords){
                                try{
                                    $('#cropWindow_widthText').val(Math.round(pCoords.w/scaleStage.scaleX));
                                    $('#cropWindow_heightText').val(Math.round(pCoords.h/scaleStage.scaleX));
                                    $('#cropWindow_xText').val(Math.round(pCoords.x/scaleStage.scaleX));
                                    $('#cropWindow_yText').val(Math.round(pCoords.y/scaleStage.scaleX));
                                }
                                catch(e){
                                    console.log('ERROR - An error while updating the crop area dimensions: '+e.toString());
                                }
                            }
                            },
                            function(){
                                jArchie.jImageCrop.currentCropWindow.jCropAPI=this;
                                jArchie.jImageCrop.currentCropWindow.jCropAPI.setSelect([10,10,50,50]);
                        });
                        $.Metro.initInputs();
                    }   
                });
            };
            this.cropWindow.prototype.newWindowCropWindow=function(pImage,pContent){
                $.Dialog({
                    shadow: true,
                    overlay: false,
                    width: 640,
                    height: 670,
                    padding: 0,
                    overlayClickClose:false,
                    content: '',
                    onShow: function(){
                        var content = pContent;
                        $.Dialog.content(content);
                        
                        scaleStage = new createjs.Stage(document.getElementById('scale_canvas'));
                        
                        var scaleBackground= new createjs.Shape();
                            scaleBackground.graphics.beginFill('#ffffff').drawRect(0,0,610,610);
                        scaleStage.addChild(scaleBackground);
                        scaleStage.setChildIndex(scaleBackground,0);

                        var imgBmp = new createjs.Bitmap(pImage);
                            imgBmp.x=(610-pImage.width)/2;
                            imgBmp.y=(610-pImage.height)/2;
                            imgBmp.name='cropimage';
                        scaleStage.addChild(imgBmp);
                        
                        imgBmp.on('mousedown',function(evt){
                            jArchie.jImageCrop.currentCropWindow.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
                        });
                        
                        imgBmp.on("pressmove",function(evt) {
                            this.x = evt.stageX + jArchie.jImageCrop.currentCropWindow.offset.x;
                            this.y = evt.stageY + jArchie.jImageCrop.currentCropWindow.offset.y;
                            scaleStage.update();   
                        });
                        
                        scaleStage.setChildIndex(imgBmp,1);
                        scaleStage.update();
                        $('#scale_canvas').bind('mouseenter',function(e){
                            $('body').css('overflow','hidden');
                        });
                        $('#scale_canvas').bind('mouseleave',function(e){
                            $('body').css('overflow','auto');
                        });
                        $('#scale_canvas').bind('mousewheel', function(e){
                            var imagery = scaleStage.getChildByName('cropimage');
                            var cScale = imagery.scaleX;
                            if(e.originalEvent.wheelDelta>0){
                                imagery.scaleX=cScale+0.02;
                                imagery.scaleY=cScale+0.02;
                            }
                            else{
                                imagery.scaleX=cScale-0.02;
                                imagery.scaleY=cScale-0.02;
                            }
                            scaleStage.update();
                        });
                        $.Metro.initInputs();
                    }   
                });
            };

            
            this.displayNewCropWindow=function(pImage){
                var content = [];
                    content.push('<div class="panel">');
                        content.push('<div class="panel-content" style="padding:0px;">');
                            content.push('<div class="grid">');
                                content.push('<div class="row" style="margin-top:0px;">');
                                    content.push('<div class="span8">');
                                        content.push('<div id="cropWindow_canvasHolder" class="span7">');
                                            //canvas
                                        content.push('</div>');
                                    content.push('</div>');
                                    content.push('<div class="span3">');
                                        content.push('<button class="button default" onclick="jArchie.jImageCrop.currentCropWindow.cropImage();"><span class="entypo-doc-landscape"></span> Crop</button></br>');
                                        content.push('<label>Crop width</label><input id="cropWindow_widthText" type="text" value=""/>');
                                        content.push('<label>Crop height</label><input id="cropWindow_heightText" type="text" value=""/>');
                                        content.push('<label>Crop x</label><input id="cropWindow_xText" type="text" value=""/>');
                                        content.push('<label>Crop y</label><input id="cropWindow_yText" type="text" value=""/>');
                                    content.push('</div>');
                                content.push('</div>');
                            content.push('</div>');
                        content.push('</div>');
                    content.push('</div>');
                    
                this.currentCropWindow = new this.cropWindow;
                this.currentCropWindow.newCropWindow(pImage,content.join(""));
            };
            this.displayNewWindowCropWindow=function(pImage){
                var content = [];
                    content.push('<div class="panel">');
                        content.push('<div class="panel-content" style="padding:0px;">');
                            content.push('<div id="cropWindow_canvasHolder">');
                                content.push('<canvas style="border:3px solid black;" id="scale_canvas" width="'+jArchie.windowTemplate.subjectWidth+'" height="'+jArchie.windowTemplate.subjectHeight+'">');
                            content.push('</div></br>');
                            content.push('<button style="margin-top:-50px;" class="button default" onclick="jArchie.jImageCrop.currentCropWindow.cropWindowCrop();"><span class="entypo-doc-landscape"></span> Crop</button>');
                        content.push('</div>');
                    content.push('</div>');
                    
                this.currentCropWindow = new this.cropWindow;
                this.currentCropWindow.newWindowCropWindow(pImage,content.join(""));
            };
    };
    ///////////////////////////////////////////////////////////////////////////
    /*
     * Initialization of the API
     */
    this.init=function(){
        //stage scale
        try{
            stage.scaleX=0.5;
            stage.scaleY=0.5;
        }
        catch(e){
            toastr.warning('The scale on the stage could not be set:\n'+e.toString());
        }
        //object init
        try{
            //stageObject = new this.jStageObjects();
            //Favicon images data read and append options
            $.get('img/favicon_images/favicon_data.txt', function(data) {
                var lines = data.split('\n');
                for(var i=0;i<lines.length;i++){
                    if(lines[i]!==''){
                        var valueS = lines[i].substring(0,lines[i].lastIndexOf('-'));
                        var textS = lines[i].substring(lines[i].lastIndexOf('-')+1,lines[i].length);
                        $('<option>').val(valueS).text(textS).appendTo('#select_favicon');
                    }
                }
             }, 'text');
            //gradient templates
            $.get('data/gradients/GRADIENT_TEMPLATES.txt', function(data) {
                var lines = data.split('\n');
                for(var i=0;i<lines.length;i++){
                    if(lines[i]!==''){
                        $('<option>').val('data/gradients/'+lines[i]).text(lines[i].substring(0,lines[i].lastIndexOf('.'))).appendTo('#select_gradient');
                    }
                }
             }, 'text');
        }
        catch(e){
            toastr.error('Initialization has failed:\n'+e.toString());
        }
        //event listener init
        try{
            //Textarea input change
            document.getElementById('textArea_content').addEventListener('input', function() {
                try{
                    if(stage.getChildIndex(stage.getChildByName('contenttext'))!==-1){
                        stage.getChildByName('contenttext').text=document.getElementById('textArea_content').value;
                        stage.update();
                    }
                    else{
                        var background = new jArchie.jStageObjects.jFillRectange('background',0,'#ffffff',0,0,720,1230);
                            background.addToStage();
                            stage.update()
                        var contentBox = new jArchie.jStageObjects.jFillRectange('contentbox',4,jArchie.contentBoxTemplate.backcolor,56,713,608,253);
                            contentBox.stageObject.alpha=jArchie.contentBoxTemplate.alpha;
                            contentBox.addToStage();
                            stage.update();
                        var contentText = new jArchie.jStageObjects.jText('contenttext',5,'',jArchie.contentBoxTemplate.textcolor,47,'normal',300,'Roboto Condensed','center',360,820);
                            contentText.addToStage();
                            stage.update();
                            $('#slider_fontSize').slider('value',47);
                    }   
                }
                catch(e){
                    console.log('ERROR - An error occured while changing the content text: '+e.toString());
                    toastr.error('The content text could not be changed.');
                }
            }, false);
            $("#slider_fontSize").slider({
                range: 'min',
                min: 8,
                max: 84,
                position: 12,
                change: function(event,ui){
                    var pValue = $("#slider_fontSize").slider('value');
                    if(stage.getChildByName('contenttext')!=null){
                        try{
                            stage.getChildByName('contenttext').font='normal 300 '+pValue+'px Roboto Condensed';
                            stage.getChildByName('contenttext').lineHeight=stage.getChildByName('contenttext').getMeasuredLineHeight()*1.276596;
                            stage.update();
                        }
                        catch(e){}
                    }
                }
              });
            $('#cnvs_stage').bind('mouseenter',function(e){
                $('body').css('overflow','hidden');
            });
            $('#cnvs_stage').bind('mouseleave',function(e){
                $('body').css('overflow','auto');
            });
            $('#cnvs_stage').bind('mousewheel', function(e){
                if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
                    if(e.originalEvent.wheelDelta>0){
                        jArchie.zoomIn('imagery');
                    }
                    else{
                        jArchie.zoomOut('imagery');
                    }
                }
            });
        }
        catch(e){
            toastr.warning('Event listeners could not be established.');
        }
        //check date for rays
        try{
            var d = new Date();
            var m = d.getMonth();
            if(m===11){
                if(d.getDate()===25){
                    toastr.success('Happy Holidays');
                    $('.navigation-bar-content').append('<div class="element place-right"><a id="celeb_control" href="#" class="element"></a></div>');
                    this.startRays();
                }
            }
            else if(m===0){
                if(d.getDate()===1){
                    toastr.success('Happy New Year');
                    $('.navigation-bar-content').append('<div class="element place-right"><a id="celeb_control" href="#" class="element"></a></div>');
                    this.startRays();
                }
            }
        }
        catch(e){}
    };
    this.init();
    this.jExcelModule = new function(){
        var excelFile = null;
        var fileReader = null;
        var b64File = null;
        var loadedXlsxJSON = null;
        var numOfRows = 0;
             
        /*
         * <a href="" class="element" id="a_uploadExcel">
         * <input id='hidden_upload' type='file' style='display:none;'/>
         * When the upload link is clicked a click event is fired on $(#hidden_upload)
         */
        document.getElementById('a_uploadExcel').addEventListener('click',fireFileSelect,false);
        document.getElementById('btn_uploadLocalImage').addEventListener('click',fireFileSelect,false);
        function fireFileSelect(){
            try{
                if(window.File && window.FileReader){
                    var newClickEvent = document.createEvent("HTMLEvents");
                    newClickEvent.initEvent('click',false,true);
                    document.getElementById('hidden_upload').dispatchEvent(newClickEvent);
                }
                else{toastr.warning('This browser does not support local file loading');}	
            }
            catch(e){}
        };
        
        /*
         * <input id='hidden_upload' type='file' style='display:none;'/>
         * Add the change event listener on the hidden input
         */
        document.getElementById('hidden_upload').addEventListener('change',handleFileSelect,false);
        function handleFileSelect(e){
            try{
                var filenameext = e.target.files[0].name.substring(e.target.files[0].name.lastIndexOf('.')+1,e.target.files[0].name.length).toLowerCase();
                if(filenameext==='xlsx'){
                    excelFile = e.target.files[0];
                    initFileReader();
                }
                else if(filenameext==='jpg' || filenameext==='png' || filenameext==='webp' || filenameext==='gif'){
                    console.log('MANUAL UPLOAD of: '+e.target.files[0].name);
                    var input, file, fr, img;

                    input = document.getElementById('hidden_upload');
                    file = input.files[0];
                    fr = new FileReader();
                    fr.onload = function(){
                        img = new Image();
                        img.onload = function(){
                            stage.removeChild(stage.getChildByName('imagery'));
                            stage.update();
                            var imagery = new createjs.Bitmap(img);
                                imagery.name='imagery';
                            stage.addChild(imagery);
                            imagery.on('mousedown',function(evt){
                                jArchie.offset = {x: this.x - evt.stageX, y: this.y - evt.stageY};
                            });
                            imagery.on("pressmove",function(evt) {
                                this.x = (evt.stageX + jArchie.offset.x);
                                this.y = (evt.stageY + jArchie.offset.y);
                                stage.update();   
                            });
                            console.log('\t\t'+'Image added to the stage.');
                                imagery.x=0;
                                imagery.y=0;
                            stage.setChildIndex(imagery,1);
                            stage.update();
                        };
                        img.src = fr.result;
                    };
                    fr.readAsDataURL(file);
                }
                else{
                    toastr.warning('You tried to load an invalid file. Archie knows only of .xlsx files');
                }
            }
            catch(e){
                console.log('ERROR - An error occured while handling the uploaded file: '+e.toString());
                toastr.error('An error occured while handling the file. Check the log.');
            }
        };
        
        function initFileReader(){
            try{
                if(excelFile===null || excelFile===undefined){
                    throw new Error('The excel file is not loaded');
                }
                else{
                    fileReader = new FileReader();
                    fileReader.onload=function(evt){
                            try{
                                b64File=evt.target.result;
                                b64File=b64File.substring(b64File.indexOf(',')+1,b64File.length);
                                b64it();
                            }
                            catch(e){}
			};
                    fileReader.readAsDataURL(excelFile);
                }
            }
            catch(e){
                toastr.error('An error occured while initializing the FileReader:\n'+e.toString());
            }
        };
        
        function b64it(){
            try{
                var wb = XLSX.read(b64File,{type:'base64'});
                if(toJSON(wb)!==null){
                    try{
                        loadedXlsxJSON=toJSON(wb);
                    }
                    catch(e){}
                    processWB();
                }
            }
            catch(e){
                toastr.error('An error occured while processing the jB64 file:\n'+e.toString());
            }
        };
        
        function toJSON(workbook){
            var result = {};
            try{
                workbook.SheetNames.forEach(function(sheetName) {
                        var roa=XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        if(roa.length>0){result[sheetName]=roa;}
                });
                return result;
            }
            catch(e){
                toastr.error('An error occured while converting workbbok to JSON: '+e.toString());
                return null;
            }
        };
        
        function processWB(){
            loadedEntries=[];
            //Iterate over each sheet and row in the workbook.
            //Rows and dates are counted and the DOM elements are prepared to accomodate individual entries
            var dates = [];
            for(var key in loadedXlsxJSON){
                if(key.lastIndexOf('Sheet',0)===0){
                    var sheet = loadedXlsxJSON[key];
                    for(var i=0;i<sheet.length;i++){
                        try{
                            var row = sheet[i];
                            var rowDate = row['Date'].replace(/\//g,'_');
                            var inDates = false;
                            for(var j=0;j<dates.length;j++){
                                if(dates[j]==rowDate){
                                    inDates=true;
                                    break;
                                }
                            }
                            //If a new date is detected a tab and its content is created for it
                            if(!inDates){
                                dates.push(rowDate);
                                var dateTabLi = document.createElement("li");
                                var dateTabAnchor = document.createElement('a');
                                    dateTabAnchor.setAttribute('href','#_entriesFrame_'+rowDate);
                                    dateTabAnchor.appendChild(document.createTextNode(rowDate));
                                    var entryCounter = document.createElement('span');
                                        entryCounter.setAttribute('style','position:relative;left:10px;font-weight:bold;color:#2f96b4;');
                                        entryCounter.setAttribute('id','entryCounter_'+rowDate);
                                        entryCounter.appendChild(document.createTextNode('(0)'));
                                    dateTabAnchor.appendChild(entryCounter);
                                    dateTabLi.appendChild(dateTabAnchor);
                                    document.getElementById('entries_tabs').appendChild(dateTabLi);
                                    
                                var dateFrame = document.createElement('div');
                                    dateFrame.setAttribute('class','frame');
                                    dateFrame.setAttribute('id','_entriesFrame_'+rowDate);
                                         
                                    document.getElementById('entries_frames').appendChild(dateFrame);
                                    
                                $('#_entriesFrame_'+rowDate).slick({
                                    infinite: false,
                                    slidesToShow: 10,
                                    slidesToScroll: 5,
                                    draggable: true,
                                    arrows: true
                                });
                            }
                            numOfRows++;
                        }
                        catch(e){
                            toastr.error('There was an error during the inital parsing of the excel file:\n'+e.toString());
                        }
                    }
                }
            }
            var progressStep = 100/numOfRows;
            var rowCounter = 0;
            
            for(var key in loadedXlsxJSON){
                if(key.lastIndexOf('Sheet',0)===0){
                    var sheet = loadedXlsxJSON[key];
                    for(var i=0;i<sheet.length;i++){
                        rowCounter++;
                        var row = sheet[i];
                        //For each row we create a object literal that hold the relevant data and that can is further passed as a parameter 
                        var rowObject = {
                                date:null,
                                topic:null,
                                topicURL:null,
                                topicTitle:null,
                                imageURL:null,
                                articleType:null
                        };
                        for(var rowKey in row){
                            switch(rowKey.toLowerCase()){
                                case 'date':
                                        if(row[rowKey]!=null){rowObject.date=row[rowKey].replace(/\//g,'_');}
                                        break;
                                case 'topic':
                                        if(row[rowKey]!=null){rowObject.topic=row[rowKey];}
                                        break;
                                case 'topic_url':
                                        if(row[rowKey]!=null){rowObject.topicURL=row[rowKey];}
                                        break;
                                case 'topic_title':
                                        if(row[rowKey]!=null){rowObject.topicTitle=row[rowKey];}
                                        break;
                                case 'image_url':
                                        if(row[rowKey]!=null){rowObject.imageURL=row[rowKey];}
                                        break;
                                case 'article_type':
                                        if(row[rowKey]!=null){rowObject.articleType=row[rowKey];}
                                        break;
                            }
                        }
                        if(rowObject['imageURL']!=null){
                            //For each date a frame with a empty list element should exist #list_date 
                            try{
                                addEntry(rowObject,rowCounter,progressStep,loadedEntries,Entry);
                            }
                            catch(e){
                                toastr.error('An error occured while adding a entry:\n'+e.toString());
                            }
                        }
                        else{
                            toastr.warning('An entry has no image URL and will not be added');
                        }
                    }
                }
            }
        };
        
        function addEntry(pRowObject,pI,pProgressStep,pEntries,pEntry){
             /*
             * <div>
             *   <img style="width:50px;height:50px;" src=""/>
             *   <label>#1</label>
             *  </div>
             */
            var image = new Image();
            image.onload=function(){
                console.log('----------ENTRY IMAGE LOADED----------');
                console.log('\t'+'Loaded entry '+pI+' image:');
                console.log('\t\t'+'width: '+image.width+', height: '+image.height);
                console.log('\t\t'+'src: '+image.src);
                console.log('----------END----------');
                var topA = document.createElement('a');
                    topA.setAttribute('id','entry_'+pI);
                    topA.setAttribute('href','#');
                    topA.setAttribute('onclick','jArchie.selectEntry(this);');
                image.style.width='75px';
                image.style.height='75px';
                var lbl = document.createElement('label');
                    lbl.setAttribute('id','lbl_IDSize_'+pI);
                    lbl.setAttribute('style','margin-left:20px;position:relative;top:-140px;font-size:30px;color:white;');
                    lbl.appendChild(document.createTextNode(pI));
                    
                var transDiv = document.createElement('div');
                    transDiv.setAttribute('style','position:relative;top:-75px;left:0px;width:75px;height:75px;background-color:black;opacity:0.5;');
                topA.appendChild(image);
                topA.appendChild(transDiv);
                topA.appendChild(lbl);
                var topDiv = document.createElement('div');
                    topDiv.setAttribute('id','div_entry_'+pI);
                    topDiv.setAttribute('style','width:60px;');
                    topDiv.appendChild(topA);
                    //topDiv.setAttribute('class','tile selected');
                $('#_entriesFrame_'+pRowObject.date).slickAdd(topDiv);
                
                try{
                   var pb = $('#progressbar_workbook').progressbar();
                   var progress = pb.progressbar('value'); 
                   pb.progressbar('value',(progress+=pProgressStep)); 
                }
                catch(e){}
                var newEntry = new pEntry();
                    newEntry.title=pRowObject.topicTitle;
                    newEntry.topic=pRowObject.topic;
                    newEntry.topicURL=pRowObject.topicURL;
                    newEntry.date=pRowObject.date;
                    newEntry.imageURL=pRowObject.imageURL;
                    newEntry.articleType=pRowObject.articleType;
                    newEntry.image=image;
                    newEntry.ID=pI;
                pEntries.push(newEntry);
                //determine the entry date and add to counter
                var countDate = parseInt(document.getElementById("entryCounter_"+pRowObject.date).innerHTML.replace(/[()]+/g,''))+1;
                var countWorkbook = parseInt(document.getElementById("workbookEntryCounter").innerHTML)+1;
                document.getElementById("entryCounter_"+pRowObject.date).innerHTML='('+countDate+')';
                document.getElementById("workbookEntryCounter").innerHTML=countWorkbook;
            };
            image.onabort=function(){
                toastr.warning('Loading of an image was aborted.');
            };
            image.src=pRowObject['imageURL'];     
        };
    };
    /*
     * Method called when an entry is clicked in the workbook
     * @param {Element} pEntryA - the <a> in the workbook that triggered this method
     */
    this.selectEntry=function(pEntryA){
        var entryID = pEntryA.id.substring(pEntryA.id.lastIndexOf('_')+1,pEntryA.id.length);     
        $('#span_firstImageTextHolder').html('Next image');
        if(stage.children.length>0){
            $.Dialog({
                shadow: true,
                overlay: false,
                draggable: true,
                width: 100,
                height: 100,
                padding: 10,
                overlayClickClose:false,
                content: '',
                onShow: function(){
                    var content = '';
                        content+='<h4>The current stage has some elements on it, do you want to override them?</h4>';
                        content+='<input type="button" class="primary" value="Yes" onclick="jArchie.displayEntryData('+entryID+');"/>';
                        content+='<input type="button" class="primary" value="No" onclick="jArchie.closeModalWindow();"/>';
                    $.Dialog.content(content);
                }
            });
        }
        else{
            this.displayEntryData(entryID); 
        }
    };
    /*
     * <a href="#" class="element place-right" onclick="jArchie.displayNextImage();">Next image <span class="entypo-right-open-big"></span></a>
     */
    this.displayNextImage=function(){
        if(currentEntryID===0){
            $('#span_firstImageTextHolder').html('Next image');
        }
        if(parseInt(currentEntryID)<=loadedEntries.length-1){
            if(isFinite(parseInt(currentEntryID))){
                var nextImageID = parseInt(currentEntryID)+1;
                for(var i=0;i<loadedEntries.length;i++){
                    if(loadedEntries[i].ID==nextImageID){
                        this.displayEntryData(nextImageID);
                        break;
                    }
                }
            }
        }
        else{
            toastr.info('This is the last loaded image.');
        }
    };
    /*
     * <a href="#" class="element" onclick="jArchie.displayPreviousImage();"><span class="entypo-left-open-big"></span> Previous image</a>
     */
    this.displayPreviousImage=function(){
        if(parseInt(currentEntryID)>=2){
            if(isFinite(parseInt(currentEntryID))){
                var previousImageID = parseInt(currentEntryID)-1;
                for(var i=0;i<loadedEntries.length;i++){
                    if(loadedEntries[i].ID==previousImageID){
                        this.displayEntryData(previousImageID);
                        break;
                    }
                }
            }
        }
        else if(parseInt(currentEntryID)===1){
            toastr.info('There are no loaded images before this one.');
        }
        else{
            toastr.info('Click next image');
        }
    };
    /*
     * Method that displays the data from the Entry on the page
     */
    this.displayEntryData=function(pID){
        this.closeModalWindow();
        console.log('----------DISPLAY ENTRY DATA----------');
        currentEntryID=pID;
        $('#stage_currentEntryH').html('Entry '+currentEntryID);
        stage.removeAllChildren();
        stage.update();
        $("#select_favicon").val('null');
        var sEntry = null;
        for(var i=0;i<loadedEntries.length;i++){
            if(loadedEntries[i].ID==pID){
                sEntry=loadedEntries[i];
                break;
            }
        }
        if(sEntry!==null){
            try{
                if(sEntry.saved===true){
                    $('#btn_saveText').html('ALREADY SAVED');
                }
                else{
                    $('#btn_saveText').html('Save to ZIP');
                }
                $('#a_imageSource').html(sEntry.imageURL);
                $('#a_imageSource').attr('href',sEntry.imageURL);
                $('#a_imageSource').attr('target','_blank');
                $('#a_articleSource').html(sEntry.topicURL);
                $('#a_articleSource').attr('href',sEntry.topicURL);
                $('#a_articleSource').attr('target','_blank');
                $('#select_template').val(sEntry.articleType);
            }
            catch(e){
                toastr.warning('Could not display the image URL');
            }
            //image
            try{
                var loadImage = new jArchie.jStageObjects.jImage('imagery',1,sEntry.imageURL,0,0);
            }
            catch(e){
                toastr.error('Could not set up the image:\n'+e.toString());
            }
            //whitebackground
            try{
                var background = new jArchie.jStageObjects.jFillRectange('background',0,'#ffffff',0,0,720,1230);
                    background.addToStage();
            }
            catch(e){
                toastr.warning('Could not display the background:\n'+e.toString());
            }
            //content box
            try{
                var contentBox = new jArchie.jStageObjects.jFillRectange('contentbox',4,jArchie.contentBoxTemplate.backcolor,56,713,608,253);
                contentBox.stageObject.alpha=jArchie.contentBoxTemplate.alpha;
                contentBox.addToStage();
            }
            catch(e){
                toastr.warning('Could not display the content box:\n'+e.toString());
            }
            //content text
            try{
                var currentText = new String(sEntry.title);
                var size = 56;
                //if(sEntry.title.length>=46){size=47;}
                $("#slider_fontSize").slider('value', size);
                var contentText = new jArchie.jStageObjects.jText('contenttext',5,sEntry.title,jArchie.contentBoxTemplate.textcolor,size,'normal',300,"Roboto Condensed",'center',360,813);
                var currentWidth = contentText.stageObject.getBounds().width;
                if(currentWidth>575){
                    var wordArray = currentText.split(' ');
                    wordArray.splice(Math.round(wordArray.length/2),0,'\n');
                    currentText = wordArray.join(' ').replace(/\n /,'\n');
                    currentText = currentText.replace(/ \n/,'\n');
                    contentText.stageObject.text=currentText;
                }
                contentText.addToStage();
                stage.update();
                //contentText.stageObject.lineHeight=contentText.stageObject.getMeasuredLineHeight()+13;//was 20
                contentText.stageObject.lineHeight=contentText.stageObject.getMeasuredLineHeight()*1.276596;
                stage.update();
                $('#textArea_content').val(currentText);
            }
            catch(e){
                toastr.warning('Could not display the article title:\n'+e.toString());
            } 
            //this.displayArticleTemplate();
            //this.getSourceFavicon();
            try{
                jArchie.setStageIndexes();
            }
            catch(e){};
        }
        else{
            toastr.warning('Could not find a matching entry.');
        }
        console.log('----------END----------');
    };
    this.getDay=function(){
        try{
            var d = new Date();  
            var weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
            var weekday = weekdays[d.getDay()];
            $("#select_day option:contains("+weekday+")").attr('selected', true);
        }
        catch(e){
            
        }
    };
    this.getSourceFavicon=function(){
        try{
            console.log('GET FAVICON');
            var $s = $('#a_articleSource').html().toLowerCase();
            var selectobject=document.getElementById("select_favicon");
            for(var i=0;i<selectobject.length;i++){
                if($s.indexOf(selectobject.options[i].value.toLowerCase())!==-1){
                    console.log('\t\t'+'Found a match on '+selectobject.options[i].value);
                    $('#select_favicon').val(selectobject.options[i].value);
                    jArchie.selectFavicon();
                    break;
                }
            }
        }
        catch(e){
            console.log('ERROR - An error occured while searching for the favicon origin site: '+e.toString());
            toastr.error('There was an error while getting the source site favicon. Check the log.');
        }
    };
    /*
     * <select id="select_template" onchange="jArchie.selectType(this.value);">
     * Method called when a type for an article is selected
     * @param {String} pValue - can be: null, coupon, flash, article
     */
    this.selectType=function(pValue){
        switch(pValue){
            case 'flash':
                this.displayFlashTemplate();
                break;
            case 'coupon':
                this.displayCouponTemplate();
                break;
            case 'article':
                this.displayArticleTemplate();
                break;
        }
    };
    /*
     * <select id="select_favicon" onchange='jArchie.selectFavicon(this.value);' style='width:300px;'>
     * Method to be called on favicon selection in a article template case
     */
    this.selectFavicon=function(){
        try{
            stage.removeChild(stage.getChildByName('articlefavicon'));
            stage.removeChild(stage.getChildByName('favicon'));
            stage.removeChild(stage.getChildByName('favicontext'));
        }
        catch(e){}
        try{
            if($('#select_favicon').val()!=='null'){
                var faviconImage = new Image();
                    faviconImage.onload=function(){
                        var favImageBmp = new createjs.Bitmap(faviconImage);
                            favImageBmp.x=0;
                            favImageBmp.y=0;//5
                        var faviconText = new createjs.Text();
                            faviconText.textBaseline='middle';//did not exist
                            faviconText.textAlign='left';
                            faviconText.color='#ffffff';
                            faviconText.font='normal 300 24px Roboto Condensed';//normal 400 24px Roboto Condensed
                            faviconText.text=$('#select_favicon option:selected').text();
                            faviconText.x=favImageBmp.getBounds().width+10;
                            faviconText.y=favImageBmp.getBounds().height/2;//was 0
                        var container = new createjs.Container();
                            container.name='articlefavicon';
                            container.addChild(favImageBmp);
                            container.addChild(faviconText);

                            var containerWidth=Math.round(container.getBounds().width);
                            var deltaW=Math.round((608-containerWidth)/2);
                            container.x=deltaW+56;
                            container.y=742;
                        stage.addChild(container);
                        stage.setChildIndex(stage.getChildByName('articlefavicon'),7);
                        stage.update();    
                    };
                    faviconImage.src='img/favicon_images/'+$('#select_favicon').val()+'.png';
            }
        }
        catch(e){
            toastr.error('An error occured while adding the favicon. Check the log.');
            console.log('ERROR - An error occured while adding the favicon: '+e.toString());
        }
    };
    this.refreshFavicons=function(){
        try{
            $.get('img/favicon_images/favicon_data.txt', function(data) {
                $('#select_favicon').html('');
                $('<option>').val('null').text('...').appendTo('#select_favicon');
                var lines = data.split('\n');
                for(var i=0;i<lines.length;i++){
                    if(lines[i]!==''){
                        var valueS = lines[i].substring(0,lines[i].lastIndexOf('-'));
                        var textS = lines[i].substring(lines[i].lastIndexOf('-')+1,lines[i].length);
                        $('<option>').val(valueS).text(textS).appendTo('#select_favicon');
                    }
                }
             }, 'text');
        }
        catch(e){
            console.log('ERROR - An error occured while refreshing the favicon data: '+e.toString());
            toastr.warning('The favicons could not be loaded.');
        }
    };
    /*
     * <select id="select_day" onchange="jArchie.selectDay();">
     * Method to be called when the day selection is changed
     */
    this.selectDay=function(){
        if(stage.getChildIndex(stage.getChildByName('favicon'))!==-1){
            stage.removeChild(stage.getChildByName('favicon'));
            stage.removeChild(stage.getChildByName('favicontext'));
            stage.update();
        }
        if(stage.getChildIndex(stage.getChildByName('dayline'))!==-1){
            stage.removeChild(stage.getChildByName('dayline'));
            stage.update();
        }
        if($('#select_day').val()!=='null'){
            try{
                var dayline = new jArchie.jStageObjects.jFillRectange('dayline',6,$('#select_day').val(),78,792,564,3);
                    dayline.addToStage();
                    stage.update();
            }
            catch(e){
                stage.update();
                console.log('ERROR - An error occured while setting the day favicon: '+e.toString());
                toastr.error('An error occured while seting up the day favicon');
            } 
        }
    };
    /*
     * <select id="select_gradient" onchange="jArchie.selectGradient();">
     */
    this.selectGradient=function(){
        if($('#select_gradient').val()!=='null'){
            try{
                stage.removeChild(stage.getChildByName('gradienttop'));
                stage.removeChild(stage.getChildByName('gradientbottom'));
                stage.update();
            }
            catch(e){}
            try{
                var value = $('#select_gradient').val();
                $.get(value, function(data) {
                    var lines = data.split('\n');
                    for(var i=0;i<lines.length;i++){
                        if(lines[i]!==''){
                            var params=lines[i].split('-');
                            var newGRAD = new jArchie.jStageObjects.jGradientFillRectange(params[0],params[1],params[2],params[3],params[4],params[5],params[6],params[7],params[8],params[9],params[10],params[11],params[12],params[13]);
                            newGRAD.stageObject.alpha=params[14];
                            newGRAD.addToStage();
                            jArchie.gradientTemplate.color1=params[2];
                            jArchie.gradientTemplate.color2=params[3];
                            if(params[0]==='gradienttop'){                                    
                                jArchie.gradientTemplate.topalpha=parseFloat(params[14]);
                                jArchie.gradientTemplate.topratio1=parseFloat(params[4]);
                                jArchie.gradientTemplate.topratio2=parseFloat(params[5]);
                            }
                            else if(params[0]==='gradientbottom'){
                                jArchie.gradientTemplate.bottomalpha=parseFloat(params[14]);
                                jArchie.gradientTemplate.bottomratio1=parseFloat(params[4]);
                                jArchie.gradientTemplate.bottomratio2=parseFloat(params[5]);
                                }
                        }
                    }
                 }, 'text');
            }
            catch(e){
                console.log('ERROR - An error occured while displaying the gradients: '+e.toString());
                toastr.error('Could not display the gradients. Check the log.');
            }
        }
        
    };
    /*
     * Method to be called to display the flash template
     */
    this.displayFlashTemplate=function(){
        console.log('----------FLASH DISPLAY----------');
        try{
            try{
                try{
                    stage.removeChild(stage.getChildByName('articlefavicon'));
                    stage.removeChild(stage.getChildByName('dayline'));
                }
                catch(e){}
                stage.removeChild(stage.getChildByName('favicon'));
                stage.removeChild(stage.getChildByName('favicontext'));
                stage.removeChild(stage.getChildByName('gradienttop'));
                stage.removeChild(stage.getChildByName('gradientbottom'));
            }
            catch(e){
                console.log('ERROR - An error occured while removing children in flash display: '+e.toString());
            } 
        }
        catch(e){}
        stage.update();
        //favicon and favicontext
        try{
            //var favicon = new jArchie.jStageObjects.jGradientFillRectange('favicon',6,'#3a94e7','#52b9f4',0,1,360,795,360,729,72,729,575,66);
            var favicon = new jArchie.jStageObjects.jGradientFillRectange('favicon',6,'#0198e9','#03bef1',0,1,360,795,360,729,72,729,575,66);
                favicon.stageObject.shadow=new createjs.Shadow('#000000',0,2,2);
                favicon.addToStage();
                stage.update();
            var favicontext = new jArchie.jStageObjects.jText('favicontext',7,'FLASH DEAL','#ffffff',36,'normal',700,"Roboto Condensed",'center',360,737);
                favicontext.addToStage();
            stage.getChildByName('favicontext').shadow = new createjs.Shadow('#000000',0,0,2);
        }
        catch(e){
            toastr.error('Could not add the favicon:\n'+e.toString());
        }
        //Gradient top and bottom
        try{
            $.get('data/gradients/flash.txt', function(data) {
                var lines = data.split('\n');
                for(var i=0;i<lines.length;i++){
                    if(lines[i]!==''){
                        var params=lines[i].split('-');
                        var newGRAD = new jArchie.jStageObjects.jGradientFillRectange(params[0],params[1],params[2],params[3],params[4],params[5],params[6],params[7],params[8],params[9],params[10],params[11],params[12],params[13]);
                        newGRAD.stageObject.alpha=params[14];
                        newGRAD.addToStage();
                        jArchie.gradientTemplate.color1=params[2];
                        jArchie.gradientTemplate.color2=params[3];
                        if(params[0]==='gradienttop'){
                            jArchie.gradientTemplate.topalpha=parseFloat(params[14]);
                            jArchie.gradientTemplate.topratio1=parseFloat(params[4]);
                            jArchie.gradientTemplate.topratio2=parseFloat(params[5]);
                        }
                        else if(params[0]==='gradientbottom'){
                            jArchie.gradientTemplate.bottomalpha=parseFloat(params[14]);
                            jArchie.gradientTemplate.bottomratio1=parseFloat(params[4]);
                            jArchie.gradientTemplate.bottomratio2=parseFloat(params[5]);
                        }
                    }
                }
            }, 'text');
        }
        catch(e){
            toastr.error('Could not add the gradients:\n'+e.toString());
        }
        this.setStageIndexes();
        console.log('----------END----------');
    };
    /*
     * Method to be called to display the coupon template
     */
    this.displayCouponTemplate=function(){
        console.log('----------COUPON DISPLAY----------');
        try{
            try{
                try{
                    stage.removeChild(stage.getChildByName('articlefavicon'));
                    stage.removeChild(stage.getChildByName('dayline'));
                }
                catch(e){}
                stage.removeChild(stage.getChildByName('favicon'));
                stage.removeChild(stage.getChildByName('favicontext'));
                stage.removeChild(stage.getChildByName('gradienttop'));
                stage.removeChild(stage.getChildByName('gradientbottom'));
            }
            catch(e){
                console.log('ERROR - An error occured while removing children in coupon display: '+e.toString());
            }
        }
        catch(e){}
        //favicon and favicontext
        try{
            //e5a60e,fff600
            var favicon = new jArchie.jStageObjects.jGradientFillRectange('favicon',6,'#f0a500','#fcef00',0,1,360,795,360,729,72,729,575,66);
                favicon.stageObject.shadow=new createjs.Shadow('#000000',0,2,2);
                favicon.addToStage();
            var favicontext = new jArchie.jStageObjects.jText('favicontext',7,'COUPON','#ffffff',36,'normal',700,"Roboto Condensed",'center',360,737);
                favicontext.addToStage();
            stage.getChildByName('favicontext').shadow = new createjs.Shadow('#000000',0,0,2);
        }
        catch(e){
            toastr.error('Could not add the favicon:\n'+e.toString());
        }
        stage.update();
        //Gradient top and bottom
        try{

            $.get('data/gradients/coupon.txt', function(data) {
                var lines = data.split('\n');
                for(var i=0;i<lines.length;i++){
                    if(lines[i]!==''){
                        var params=lines[i].split('-');
                        var newGRAD = new jArchie.jStageObjects.jGradientFillRectange(params[0],params[1],params[2],params[3],params[4],params[5],params[6],params[7],params[8],params[9],params[10],params[11],params[12],params[13]);
                        newGRAD.stageObject.alpha=params[14];
                        newGRAD.addToStage();
                        jArchie.gradientTemplate.color1=params[2];
                        jArchie.gradientTemplate.color2=params[3];
                        if(params[0]==='gradienttop'){
                            jArchie.gradientTemplate.topalpha=parseFloat(params[14]);
                            jArchie.gradientTemplate.topratio1=parseFloat(params[4]);
                            jArchie.gradientTemplate.topratio2=parseFloat(params[5]);
                        }
                        else if(params[0]==='gradientbottom'){
                            jArchie.gradientTemplate.bottomalpha=parseFloat(params[14]);
                            jArchie.gradientTemplate.bottomratio1=parseFloat(params[4]);
                            jArchie.gradientTemplate.bottomratio2=parseFloat(params[5]);
                        }
                    }
                }
            }, 'text');
        }
        catch(e){
            toastr.error('Could not add the gradients:\n'+e.toString());
        }
        this.setStageIndexes();
        console.log('--------------------');
    };
    /*
     * Method to be called to display the article template
     */
    this.displayArticleTemplate=function(){
        console.log('----------ARTICLE DISPLAY----------');
        try{
            stage.removeChild(stage.getChildByName('favicon'));
            stage.removeChild(stage.getChildByName('gradienttop'));
            stage.removeChild(stage.getChildByName('gradientbottom'));
            stage.removeChild(stage.getChildByName('favicontext'));
            //stage.removeChild(stage.getChildByName('dayline'));
            if($('#select_favicon').val()!=='null'){
                stage.removeChild(stage.getChildByName('articlefavicon'));
            }
            stage.update();            
        }
        catch(e){
            console.log('ERROR - An error occured while removing children in article display: '+e.toString());
            stage.update();
        }
        try{
            var gradTop = new jArchie.jStageObjects.jGradientFillRectange('gradienttop',2,'#000000','rgba(255, 255, 255, 0)',0,0.3,360,0,360,1230,0,0,720,1230);
                gradTop.stageObject.alpha=0.6;
                gradTop.addToStage();
            var gradBottom = new jArchie.jStageObjects.jGradientFillRectange('gradientbottom',3,'#000000','rgba(255, 255, 255, 0)',0,0.5,360,1230,360,0,0,0,720,1230);
                gradBottom.stageObject.alpha=0.6;
                gradBottom.addToStage(); 
            var dayLine = new jArchie.jStageObjects.jFillRectange('dayline',6,$('#select_day').val(),78,792,564,3);
                dayLine.addToStage();
            this.getSourceFavicon();
            /*if($('#select_favicon').val()!=='null'){
                this.selectFavicon();
            }*/   
            stage.update();
            jArchie.gradientTemplate.topalpha=0.6;
            jArchie.gradientTemplate.bottomalpha=0.6;
            jArchie.gradientTemplate.color1='#000000';
            jArchie.gradientTemplate.color2='rgba(255, 255, 255, 0)';
            jArchie.gradientTemplate.topratio1=0;
            jArchie.gradientTemplate.topratio2=0.3;
            jArchie.gradientTemplate.bottomratio1=0;
            jArchie.gradientTemplate.bottomratio2=0.5;
        }
        catch(e){
            console.log('ERROR - An error occured while creating the article template: '+e.toString());
            toastr.error('The article template could not be displayed. Check the log.');
            stage.update();
        }
        console.log('--------------------');
    };
    /*
     * Method to set the indexes of the stage children
     */
    this.setStageIndexes=function(){
        console.log('----------SET STAGE INDEXES----------');
        try{
            stage.setChildIndex(stage.getChildByName('background'),0);
            console.log('\t background set to 0');
        }
        catch(e){}
        try{
           stage.setChildIndex(stage.getChildByName('imagery'),1);
           console.log('\t imagery set to 1');
        }
        catch(e){}
        try{
            stage.setChildIndex(stage.getChildByName('gradienttop'),2);
            console.log('\t gradinettop set to 2');
            stage.setChildIndex(stage.getChildByName('gradientbottom'),3);
            console.log('\t gradientbottom set to 3');
            stage.setChildIndex(stage.getChildByName('contentbox'),4);
            console.log('\t contentbox set to 4');
            stage.setChildIndex(stage.getChildByName('contenttext'),5);
            console.log('\t contenttext set to 5');
        }
        catch(e){}
        try{
            stage.setChildIndex(stage.getChildByName('dayline'),6);
            console.log('\t dayline set to 6');
            stage.setChildIndex(stage.getChildByName('articlefavicon'),7);
            console.log('\t articlefavicon set to 7');
        }
        catch(e){}
        try{
            stage.setChildIndex(stage.getChildByName('favicon'),6);
            console.log('\t favicon set to 6');
            stage.setChildIndex(stage.getChildByName('favicontext'),7);
            console.log('\t favicontext set to 7');
        }
        catch(e){}
        console.log('--------------------');
        stage.update();
    };
    /*
     * Change the sacle of the imagery
     */
    this.zoomIn=function(pElementName){
        try{
            stage.getChildByName(pElementName).scaleX=stage.getChildByName(pElementName).scaleX+0.025;
            stage.getChildByName(pElementName).scaleY=stage.getChildByName(pElementName).scaleY+0.025;
            stage.update(); 
        }
        catch(e){}
    };
    this.zoomOut=function(pElementName){
        try{
            stage.getChildByName(pElementName).scaleX=stage.getChildByName(pElementName).scaleX-0.025;
            stage.getChildByName(pElementName).scaleY=stage.getChildByName(pElementName).scaleY-0.025;
            stage.update();
        }
        catch(e){}
    };
    this.centerHorizontally=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
            try{
                var imagery = stage.getChildByName('imagery');
                imagery.x=(720-imagery.getBounds().width*imagery.scaleX)/2;
                stage.update();
            }
            catch(e){
                console.log('ERROR - An error while centering the imagery horizontally: '+e.toString());
            }
        }
    };
    this.centerVertically=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
            try{
                var imagery = stage.getChildByName('imagery');
                imagery.y=(1230-imagery.getBounds().height*imagery.scaleY)/2;
                stage.update();
            }
            catch(e){
                console.log('ERROR - An error while centering the imagery vertically: '+e.toString());
            }
        }
    };
    ////////////////////////////////////////////////////////////////////////////
    /*
    /* Editors
    */
    ////////////////////////////////////////////////////////////////////////////
    this.showContentBoxEditor=function(){
        var newCBE = new this.jObjectEditor.contentBoxEditor(250,400,'Content box background');
    };
    this.showImageQualityEditor=function(){
        var newIQE = new this.jObjectEditor.imageQualityEditor(500,200,'Image quality');
    }; 
    this.showWindowTemplateEditor=function(){
        var newWTE = new this.jObjectEditor.windowTemplateEditor(250,200,'Window template');
    };
    this.showGradientEditor=function(){
         var newGE = new this.jObjectEditor.gradientEditor(400,600,'Gradient Editor');
    };
    this.showCropWindow=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){            
            var imagery = stage.getChildByName('imagery');
            this.jImageCrop.displayNewCropWindow(imagery.image);
        }
    };
    this.showWindowCropWindow=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
            var imagery = stage.getChildByName('imagery');
            imagery.scaleX=imagery.scaleY=1;
            stage.update();
            this.jImageCrop.displayNewWindowCropWindow(imagery.image);
        }
    };
    this.closeModalWindow=function(){
        try{
            $('.btn-close').click();
        }
        catch(e){}
    };
    ////////////////////////////////////////////////////////////////////////////
    /*
     * Article styles
     */
    ////////////////////////////////////////////////////////////////////////////
    this.setFullScreenImage=function(){
        try{
            if(stage.getChildIndex(stage.getChildByName('background'))!==-1){
                stage.removeChild(stage.getChildByName('background'));
                var background = new jArchie.jStageObjects.jFillRectange('background',0,'#ffffff',0,0,720,1230);
                    background.addToStage();
                    stage.update();
            }
            if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
                var imagery = stage.getChildByName('imagery');
                var w = imagery.getBounds().width*imagery.scaleX;
                var h = imagery.getBounds().height*imagery.scaleY;
                if(w<720 || h<1230){
                    var cw = w;
                    var ch = h;
                    var scale = imagery.scaleX;
                    while(cw<720 || ch<1230){
                        scale+=0.001;
                        imagery.scaleX=imagery.scaleY=scale;
                        stage.update();
                        cw = imagery.getBounds().width*imagery.scaleX;
                        ch = imagery.getBounds().height*imagery.scaleY;
                    }
                }
                this.centerHorizontally();
                this.centerVertically();
            }
        }
        catch(e){
            console.log('ERROR - An error occured while displaying the full image article: '+e.toString());
            toastr.error('Could not display the full image:\n'+e.toString());
        }     
    };
    this.setWindowImage=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
            var imagery = stage.getChildByName('imagery');
            var w = imagery.getBounds().width*imagery.scaleX;
            var h = imagery.getBounds().height*imagery.scaleY;
            console.log('-------------------------------------------');
            console.log('Imagery dimensions w: '+w+' h: '+h);
                        
            var deltax = Math.abs(w-jArchie.windowTemplate.subjectWidth);
            var deltay = Math.abs(h-jArchie.windowTemplate.subjectHeight);
            console.log('\t\t'+'deltax: '+deltax+' deltay: '+deltay);
            if(deltax>7 || deltay>7){
                if(w<jArchie.windowTemplate.subjectWidth || h<jArchie.windowTemplate.subjectHeight){
                    this.showWindowCropWindow();
                }
                else if(w>jArchie.windowTemplate.subjectWidth || h>jArchie.windowTemplate.subjectHeight){
                    toastr.warning('The image width or height are bigger than '+jArchie.windowTemplate.subjectWidth+'x'+jArchie.windowTemplate.subjectHeight+'px.\n'+'Use the crop tool.');
                    this.showWindowCropWindow();
                }
            }
            else{
                try{
                    if(jArchie.windowTemplate.y==='auto'){
                        this.centerVertically();
                    }
                    else{
                        imagery.y=jArchie.windowTemplate.y;
                    }
                    if(jArchie.windowTemplate.x==='auto'){
                        this.centerHorizontally();
                    }
                    else{
                        imagery.x=jArchie.windowTemplate.x;
                    }
                    this.addBlurBackgroundImage();
                    stage.getChildByName('imagery').shadow=new createjs.Shadow('#aaaaaa',0,0,3);
                    stage.update();
                }
                catch(e){
                    console.log('ERROR - An error occured while setting-up the imagery in window template: '+e.toString());
                    toastr.error('There was an error while positioning the image. Check the template setup.');
                }
            }
        }
    };
    this.addBlurBackgroundImage=function(){
        if(stage.getChildIndex(stage.getChildByName('imagery'))!==-1){
            console.log('----BLUR FILTER----');
            try{
                var imagery = stage.getChildByName('imagery');
                if(stage.getChildIndex(stage.getChildByName('background'))!==-1){
                    stage.removeChild(stage.getChildByName('background'));
                    stage.update();
                }
                
                var blurFilter = new createjs.BlurFilter(jArchie.windowTemplate.blur,jArchie.windowTemplate.blur,2);
		var newImagery = imagery.clone();
                    newImagery.scaleX=newImagery.scaleY=1;
                //iter to find the right scale for the background
                var cw = newImagery.getBounds().width*0.5;
                var ch = newImagery.getBounds().height*0.5;
                
                if(cw<320 || ch<1230){
                    var cScale=1;
                    while(cw<320 || ch<1230){
                        cScale+=0.1;
                        cw=newImagery.getBounds().width*0.5*cScale;
                        ch=newImagery.getBounds().height*0.5*cScale;
                    }
                    newImagery.scaleX=newImagery.scaleY=cScale;
                }
                console.log(cw+' '+ch+' '+(320-cw)/2+' '+(1230-ch)/2);
                newImagery.x=(320-cw)/2;
                newImagery.y=(1230-ch)/2;
		newImagery.filters = [blurFilter];
		newImagery.cache(0,0,imagery.image.width, imagery.image.height);
                
                newImagery.name='background';
		stage.addChild(newImagery);
                stage.setChildIndex(newImagery,0); 
                stage.update();
            }
            catch(e){
                console.log('ERROR - An error occured while applying the blur filter: '+e.toString());
                toastr.error('There was an error while applying the blur filter. Check the log.');
            }
            console.log('----END----');
        }
    };
    ////////////////////////////////////////////////////////////////////////////
    this.checkPreSave=function(){
        console.log('PRESAVE CHECK');
        console.log('\t\t found: '+stage.children.length+' of 8');
        if(stage.children.length<8){
            $.Dialog({
                shadow: true,
                overlay: false,
                draggable: true,
                width: 100,
                height: 100,
                padding: 10,
                overlayClickClose:false,
                content: '',
                onShow: function(){
                    var content = '';
                        content+='<h4>The current stage seems to be missing some elements. Do you want to save?</h4>';
                        content+='<input type="button" class="primary" value="Yes" onclick="jArchie.saveImage();"/>';
                        content+='<input type="button" class="primary" value="No" onclick="jArchie.closeModalWindow();"/>';
                    $.Dialog.content(content);
                }
            });
        }
        else{
            jArchie.saveImage();
        }
    };
    this.saveImage=function(){
        try{
            var imageType = $('#select_imageType').val();
            stage.scaleX=1;
            stage.scaleY=1;
            document.getElementById('cnvs_stage').setAttribute('width','720');
            document.getElementById('cnvs_stage').setAttribute('height','1230');
            stage.update();
            var stageCanvasSmall=document.getElementById("cnvs_stage");
            var IMGDATA = stageCanvasSmall.toDataURL(imageType,jArchie.imageQuality);
            var head = 'data:'+imageType+';base64,';
            //http://stackoverflow.com/questions/18557497/how-to-get-html5-canvas-todataurl-file-size-in-javascript?answertab=active#tab-top
            var imgFileSize = Math.round(((IMGDATA.length - head.length)*3/4)/1000);
            if(imgFileSize>110 || imgFileSize<90){
                var currImgQ = jArchie.imageQuality;
                var counter = 0;
                while(imgFileSize>105 || imgFileSize<95){
                    if(imgFileSize>110){
                        currImgQ=currImgQ-0.02;
                        IMGDATA = stageCanvasSmall.toDataURL(imageType,currImgQ);
                    }
                    else if(imgFileSize<90){
                        currImgQ=currImgQ+0.02;
                        IMGDATA = stageCanvasSmall.toDataURL(imageType,currImgQ);
                    }
                    else{
                        break;
                    }
                    imgFileSize = Math.round(((IMGDATA.length - head.length)*3/4)/1000);
                    counter++;
                    if(counter>20){
                        toastr.info('File size could not be put in the [90,110]KB range. Try manually.');
                        IMGDATA = stageCanvasSmall.toDataURL(imageType,jArchie.imageQuality);
                        break;
                    }
                }
            }
            stage.scaleX=0.5;
            stage.scaleY=0.5;
            document.getElementById('cnvs_stage').setAttribute('width','360');
            document.getElementById('cnvs_stage').setAttribute('height','615');
            stage.update();
            var date = 'null';
            var contenttext = 'null';
            for(var i=0;i<loadedEntries.length;i++){
                if(loadedEntries[i].ID==currentEntryID){
                    date=loadedEntries[i].date;
                    contenttext=loadedEntries[i].title;
                    loadedEntries[i].saved=true;
                    if(contenttext.length>=14){
                        contenttext=contenttext.substring(0,14);
                    }
                    else if(contenttext.length>0 && contenttext.length<14){
                        contenttext=contenttext.substring(0,contenttext.length);
                    }
                    else{
                        contenttext='NOTITLE_'+Math.random();
                    }
                    break;
                }
            }
            try{
                contenttext=contenttext.replace(/\ /g,'-');
                contenttext=contenttext.replace(/\%/g,'percent');
                contenttext=contenttext.replace(/\//g,'-');
            }
            catch(e){}
            var dateArray=date.split('_');
            if(dateArray[0].length==1){dateArray[0]='0'+dateArray[0]};
            if(dateArray[1].length==1){dateArray[1]='0'+dateArray[1]};
            if(dateArray[2].length==2){dateArray[2]='20'+dateArray[2]};
            date=dateArray.join('');
            var saveFileExtension = imageType.substring(imageType.indexOf('/')+1,imageType.length)==='jpeg' ? 'jpg' : imageType.substring(imageType.indexOf('/')+1,imageType.length);
            ZIP.file(contenttext+'-'+date+'.'+saveFileExtension,IMGDATA.substr(IMGDATA.indexOf(',')+1,IMGDATA.length),{base64:true});
            toastr.success('Saved to the ZIP');
            //$('#div_entry_'+currentEntryID).css('border','3px solid #2f96b4');
            $('#lbl_IDSize_'+currentEntryID).css('top','-160px');
            $('#lbl_IDSize_'+currentEntryID).html(currentEntryID+'</br><span style="font-size:12px;">'+imgFileSize+'KB</span>');
        }
        catch(e){
            stage.scaleX=0.5;
            stage.scaleY=0.5;
            document.getElementById('cnvs_stage').setAttribute('width','360');
            document.getElementById('cnvs_stage').setAttribute('height','615');
            stage.update();
            console.log('ERROR - An error occured while saving the image: '+e.toString());
            toastr.error('Could not generate an image:\n'+e.toString());
        }
    };
    this.getImageSize=function(){
        try{
            var imageType = $('#select_imageType').val();
            stage.scaleX=1;
            stage.scaleY=1;
            document.getElementById('cnvs_stage').setAttribute('width','720');
            document.getElementById('cnvs_stage').setAttribute('height','1230');
            stage.update();
            var stageCanvasSmall=document.getElementById("cnvs_stage");
            var IMGDATA = stageCanvasSmall.toDataURL(imageType,jArchie.imageQuality);
            stage.scaleX=0.5;
            stage.scaleY=0.5;
            document.getElementById('cnvs_stage').setAttribute('width','360');
            document.getElementById('cnvs_stage').setAttribute('height','615');
            stage.update();
            var head = 'data:'+imageType+';base64,';
            //http://stackoverflow.com/questions/18557497/how-to-get-html5-canvas-todataurl-file-size-in-javascript?answertab=active#tab-top
            return Math.round(((IMGDATA.length - head.length)*3/4)/1000);
        }
        catch(e){
            console.log('ERROR - An error occured while getting the image size: '+e.toString());
            return 0;
        }
    };
    this.downloadZip=function(){
        try{
            var content = ZIP.generate({type:"blob"});
            var d = new Date();
            var year = d.getFullYear();
            var month = d.getMonth()+1;
                month = (month<10) ? '0'+month : month.toString();
            var day = d.getDate();
                day = (day<10) ? '0'+day : day.toString();

            saveAs(content,year+'-'+month+'-'+day+'_articlebatch.zip');
            ZIP = new JSZip();
        }
        catch(e){
            console.log('ERROR - An error occured while saving the ZIP: '+e.toString());
            toastr.error('Could not generate the ZIP - check the log.');
        }
    };
};

