/* Blank Canvas Signatures for Gmail [http://blankcanvas.me/gmailsignatures/]
 * Copyright (c) 2009, 2010 Jerome Dane <http://blankcanvas.me/contact/>  
 * 
 * This file is part of the Blank Canvas Signatures for Gmail. Please see /readme.md for
 * more information, credits, and author requests. 
 * 
 * BC Gmail Signatures is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
if(!com) { var com = {}; }
if(!com.BlankCanvas) { com.BlankCanvas = {}; }

com.BlankCanvas.GmailSigInstance = function(gmailInstance){
	console.log('gmail inst');
	var _this = this;
	this.debug = function(str) {
		console.log(str);
		if(bcgs.getPref('debugMode') == 'alert') {
			alert("com.BlankCanvas.GmailSigInstance:\n\n" + str);
		} else {
			throw new Error("com.BlankCanvas.GmailSigInstance:\n\n" + str);
		}
	}
		this.$ = gmailInstance.$;
		
		this.gmail = gmailInstance;
		this.wrappers = {};
		var sigInst = this;
		sigInst.gmail.unsafeWin.addEventListener('unload', function() {
			sigInst = null;
			delete sigInst;
		}, true);
		
		var bcgs = com.BlankCanvas.GmailSignatures;
		//----------------------- View Change ---------------------
		this.viewChange = function() {
			switch(sigInst.gmail.getActiveViewType()) {
				case 'co':
					sigInst.gmail.registerMessageBoxHandler(sigInst.composeContext);
					break;
				case 'cv':
					sigInst.gmail.registerMessageBoxHandler(sigInst.conversationContext);
					break;
			}
		};
		//----------------------- Compose Context -----------------
		this.composeContext = function() {
			if (sigInst.gmail.isTearOut) 
				sigInst.conversationContext();
			else {
				sigInst.selectedSigType = {}; // reset selected signature type to default
				var fromSelector = sigInst.gmail.getFromSelect();
				if (fromSelector) 
					fromSelector.addEventListener('change', sigInst.insertSignatureAndUpdateTools, true);
				sigInst.drawToolsForActiveView();
				sigInst.insertSignature();
			}
		};
		//----------------------- Compose Context -----------------
		this.conversationContext = function() {
			sigInst.drawToolsForActiveView();
			// insert sig
			sigInst.insertSignature(sigInst.gmail.getFromAddress());
			// listen for message box gone
			sigInst.gmail.registerMessageBoxGoneHandler(sigInst.viewChange);
			// listen for from select
			sigInst.gmail.registerFromSelectHandler(function(fromSelect) {
				sigInst.selectedSigType = {};	// reset selected signature type to default
				sigInst.insertSignatureAndUpdateTools();
				sigInst.gmail.getFromSelect().addEventListener('change', sigInst.insertSignatureAndUpdateTools, false);
			});
		};
		//----------------------- drawToolsAfter -----------------
		this.drawToolsAfter = function(elem) { 
		
			sigInst.getCurrentSignature(function(currentSig) {
				sigInst.selectedSigType = typeof(sigInst.selectedSigType) == 'undefined' ? {} : sigInst.selectedSigType;
				
				// remove any existing signature tools and re-draw them
				sigInst.wrappers.tools = typeof(sigInst.wrappers.tools) == 'undefined' ? sigInst.gmail.createElement('span') : sigInst.wrappers.tools;
				sigInst.wrappers.tools.innerHTML = '';
				
				// determine whether using multiple from addresses or not 
				if(elem.attr('name') == 'to') {
					sigInst.wrappers.tools.innerHTML = 'Signature '; // reset tools
					sigInst.wrappers.tools.setAttribute('style', 'display:block; margin:.5em 0;');
				} else {
					sigInst.wrappers.tools.setAttribute('style', 'margin-left:.5em;');
				}
				
				// signature type
				var sigSelect = sigInst.gmail.createElement('select');
				sigSelect.id = 'bcGmailSigsSigTypeSelector';
				sigSelect.setAttribute('style', 'font-size:80%');
				sigSelect.addEventListener('change', function() {
					sigInst.selectedSigType[sigInst.gmail.getFromAddress()] = this.selectedIndex;
					sigInst.insertSignatureAndUpdateTools();
				}, true);
				var optionsHtml = '';
				for(var i = 1; i < 5; i++) {
					var selectedTypeIndex = typeof(sigInst.selectedSigType[sigInst.gmail.getFromAddress()]) != 'undefined' ? sigInst.selectedSigType[sigInst.gmail.getFromAddress()] : 0;
					optionsHtml += '<option' + (i == selectedTypeIndex + 1 ? ' selected="selected"' : '') + '>' + unescape(bcgs.getPref('label' + i)) + '</option>';
				}
				sigSelect.innerHTML = optionsHtml;	
				sigInst.$(sigInst.wrappers.tools).append(sigSelect);
				
				// create/edit button
				var createEdit = bcgs.formatIconButton(sigInst.gmail.createElement('img'));
				createEdit.addEventListener('click', sigInst.showSignatureEdit, true);
				createEdit.src = currentSig == '' ? bcgs.icons.signatureCreate : bcgs.icons.signatureEdit;
				createEdit.title = currentSig == '' ? bcgs.getText('createSignature') : bcgs.getText('editSignature');
				sigInst.$(sigInst.wrappers.tools).append(createEdit);
				// reinsertButton
				if(bcgs.getPref('showReinsert') == 'true') {
					var reinsertButton = bcgs.formatIconButton(sigInst.gmail.createElement('img'));
					reinsertButton.src = bcgs.icons.signatureReinsert;
					reinsertButton.title = bcgs.getText('reinsertTitle');
					sigInst.$(reinsertButton).click(sigInst.insertSignature);
					sigInst.$(sigInst.wrappers.tools).append(reinsertButton);
				}
				// remove button
				if(bcgs.getPref('showRemove') == 'true') {
					var removeButton = bcgs.formatIconButton(sigInst.gmail.createElement('img'));
					removeButton.src = bcgs.icons.signatureRemove;
					removeButton.title = bcgs.getText('removeButtonTitle');
					sigInst.$(removeButton).click(sigInst.removeSignature);
					sigInst.$(sigInst.wrappers.tools).append(removeButton);
				}
				// options button
				var button = bcgs.formatIconButton(sigInst.gmail.createElement('img'));
				button.src = bcgs.icons.signatureOptions;
				button.title = "Blank Canvas Signatures for Gmail - " + bcgs.getText('options');
				sigInst.$(button).click(sigInst.showSignatureOptions);
				sigInst.$(sigInst.wrappers.tools).append(button);
				// append wrapper
				sigInst.$(elem).after(sigInst.wrappers.tools);
				
			});
		};
		//----------------------- drawToolsForCompose ------------
		this.drawToolsForActiveView = function() {
			var fromSelect = sigInst.gmail.getFromSelect();
			fromSelect = fromSelect ? sigInst.$(fromSelect) : false;
			var discardButton = null;
			function getTargetWhenNoSelector() {
				
				var toField = sigInst.gmail.getToField();
				return toField;
				
			}
			switch(sigInst.gmail.getActiveViewType()) {
				// compose view
				case 'co':
					sigInst.$('div[role="navigation"]:eq(2) > div:first > .d2:eq(0)').before(
						sigInst.getSignatureButton()
					);
					
					//	var elem = fromSelect ? fromSelect : getTargetWhenNoSelector();
					//	sigInst.drawToolsAfter(elem);
					break;
				// conversation
				case 'cv':
					
					sigInst.$('div[role="navigation"]').each(function(i) {
						this.id += ' SDFDSGDSGREEFGGFGDFDGDF_' + i;
					});
					sigInst.$('div[role="navigation"]:eq(2) > div:first + div > .d2:eq(0)').before(
						sigInst.getSignatureButton()
					);
					/*
				
					if(fromSelect)
						sigInst.drawToolsAfter(fromSelect);
					else {
						var fromHiddenInput = sigInst.$('input[name="from"]', sigInst.gmail.getActiveElement());
						var elem = fromHiddenInput.size() == 1 ? fromHiddenInput : getTargetWhenNoSelector();
						sigInst.drawToolsAfter(elem);
					}
					* */
					break;
			}
			// implement fix for Chrome selector not expanding bug
			if(discardButton && com.BlankCanvas.BrowserDetect.browser == 'Chrome') {
				var wrapper = sigInst.$('#bcGmailSigsSigTypeSelector').parent();
				wrapper.css('position', 'absolute');
				//alert(sigInst.$(discardButton).position().left);
				wrapper.css('top', (sigInst.$(discardButton).position().top + 2) + 'px');
				wrapper.css('left', (sigInst.$(discardButton).position().left + sigInst.$(discardButton).width() + 10) + 'px');
			}
			sigInst.enableButtonMouseover();
		
		};
		//---------------------- getCurrentSignature -------------
		this.getCurrentSignature = function(callback) {
			
				bcgs.getSignature(sigInst.getCurrentSignatureKey(), function(sig) {
					callback(sig);
				});				
		};
		//---------------------- getCurrentSignature -------------
		this.getCurrentSignatureKey = function() {
			
				var index = typeof(sigInst.selectedSigType[sigInst.gmail.getFromAddress()]) != 'undefined' ? sigInst.selectedSigType[sigInst.gmail.getFromAddress()] : 0;
				if(typeof(index) == 'undefined') {
					index = 0;
				}				
				var sigVersion = index == 0 ? '' : index + 1;
				return sigInst.gmail.getFromAddress() + sigVersion.toString();
		};
		//---------------------- hideSignatureEdit -------------
		this.hideDonationBox = function() {
			
				var activeElement = sigInst.gmail.getActiveElement();
				sigInst.$('#bcGmailSigsDonateWrapper', activeElement).remove();
		};
		//---------------------- hideSignatureEdit -------------
		this.hideSignatureEdit = function() {
			
				var activeElement = sigInst.gmail.getActiveElement();
				sigInst.$('#bcGmailSigsEditWrapper', activeElement).remove();
		};
		//---------------------- hideSignatureOptions -------------
		this.hideSignatureOptions = function() {
			
				var activeElement = sigInst.gmail.getActiveElement();
				sigInst.$('#bcGmailSigsOptionsWrapper', activeElement).remove();
				sigInst.hideDonationBox();
		};
		//---------------------- insertSignature -----------------
		this.insertSignatureAndUpdateTools = function() {
			sigInst.drawToolsForActiveView();
			sigInst.insertSignature();
			sigInst.updateSignatureEditBox();
			
			// update button label
			var i = typeof(sigInst.selectedSigType[sigInst.gmail.getFromAddress()]) != 'undefined' ? sigInst.selectedSigType[sigInst.gmail.getFromAddress()] + 1 : 1;	
			sigInst.$('.buttonLabel', sigInst.buttonWrapper).text(unescape(bcgs.getPref('label' + i)) );
			
			// update button menu items 
			sigInst.$('.bcSigSelectType', sigInst.buttonWrapper).css('font-weight', 'normal');
			sigInst.$('.bcSigSelectType:eq(' + (i - 1) + ')', sigInst.buttonWrapper).css('font-weight', 'bold');
			sigInst.$('.bcSigSelectType', sigInst.buttonWrapper).each(function(indx) {
				this.className = this.className.replace(/\s*J-Ks-KO/, '');
				if(i - 1 == indx) {
					this.className += ' J-Ks-KO';
				}
			});			
			
		};
		//---------------------- insertSignature -----------------
		this.insertSignature = function() {
			
				// create wrapper
				var messageIframe = sigInst.gmail.getMessageIframe(); 
				if (messageIframe) {
					sigInst.getCurrentSignature(function(sigHtml) {
						var key = com.BlankCanvas.md5(sigInst.gmail.getPrimaryEmailAddress()).match(/^.{10}/)[0];
						var messageElement = messageIframe.contentDocument.body;
						var existingSig = sigInst.$('div[name=sig_' + key + ']', messageElement);
						var newSig = existingSig.size() > 0 ? existingSig[0] : messageIframe.contentDocument.createElement('div');
						newSig.innerHTML = sigHtml;
						newSig.setAttribute('name', 'sig_' + key);
						newSig.style.margin = sigHtml == '' ? '0pt' : '2em 0pt';
						var quoteElement = sigInst.$('div.gmail_quote', messageElement);
						if (quoteElement.size() > 0) {
							if(bcgs.getPref('sigPosition') == 'below') sigInst.$(quoteElement[0]).after(newSig);
							else sigInst.$(quoteElement[0]).before(newSig);
						} else if (existingSig.size() == 0) sigInst.$(messageElement).append(newSig);	
					});
				}
		};
		//---------------------- insertSignature -----------------
		this.removeSignature = function() {
			//
				var messageIframe = sigInst.gmail.getMessageIframe(); 
				var messageElement = messageIframe.contentDocument.body;
				var key = com.BlankCanvas.md5(sigInst.gmail.getPrimaryEmailAddress()).match(/^.{10}/)[0];
				var existingSig = sigInst.$('div[name="sig_' + key + '"]', messageElement);
				if(existingSig.size() > 0)
					existingSig.remove();
			//} catch(e) { console.log("removeSignature()\n\n" + e); }
		};
		//---------------------- saveOptions ------------------
		this.saveOptions = function() {
						
				var activeElement = sigInst.gmail.getActiveElement();
				var oldPosition = bcgs.getPref('sigPosition');
				var newPosition = sigInst.$('#bcGmailSigsSigPositionOption', activeElement).attr('value'); 
				bcgs.setCharPref('sigPosition', newPosition);
				if(oldPosition != newPosition) sigInst.insertSignature(true);
				bcgs.setCharPref('label1', escape(sigInst.$('#bcGmailSigsLabel1Option', activeElement).attr('value')));
				bcgs.setCharPref('label2', escape(sigInst.$('#bcGmailSigsLabel2Option', activeElement).attr('value')));
				bcgs.setCharPref('label3', escape(sigInst.$('#bcGmailSigsLabel3Option', activeElement).attr('value')));
				bcgs.setCharPref('label4', escape(sigInst.$('#bcGmailSigsLabel4Option', activeElement).attr('value')));
				bcgs.setCharPref('showReinsert', sigInst.$('#bcGmailSigsReinsertButtonOption', activeElement)[0].checked ? 'true' : 'false');
				bcgs.setCharPref('showRemove', sigInst.$('#bcGmailSigsRemoveButtonOption', activeElement)[0].checked ? 'true' : 'false');
				bcgs.setCharPref('showFeedbackButton', sigInst.$('#bcGmailSigsFeedbackButtonOption', activeElement)[0].checked ? 'true' : 'false');
				bcgs.setCharPref('showDonateButton', sigInst.$('#bcGmailSigsDonateButtonOption', activeElement)[0].checked ? 'true' : 'false');
				bcgs.setCharPref('storageMethod', sigInst.$('#bcGmailSigsStorageModeOption', activeElement).attr('value'));
				
				sigInst.buttonWrapper.remove();
				sigInst.buttonWrapper = null;
				
				sigInst.insertSignatureAndUpdateTools();
		}
		//---------------------- saveSignature -----------------
		this.saveSignature = function() {
			
				var activeElement = sigInst.gmail.getActiveElement();
				bcgs.saveSignature(sigInst.getCurrentSignatureKey(), sigInst.$('#bcGmailSigsEditSig', activeElement).attr('value'), function() {
					sigInst.hideSignatureEdit();
					sigInst.insertSignatureAndUpdateTools();
				});
		}
		//---------------------- showDonateBox ------------------
		this.showDonateBox = function() {
			
				var wrapper = sigInst.gmail.createElement('div')
				wrapper.id = 'bcGmailSigsDonateWrapper';
				wrapper.setAttribute('style', 'z-index:3000; position:fixed; top:50px; left:0; width:100%;');
				wrapper.innerHTML ='\
					<style type="text/css">\
						#bcGmailSigsDonateForm a { text-decoration:none;  }\
						#bcGmailSigsDonateForm a:hover { text-decoration:underline;  }\
						#bcGmailSigsDonateForm li { padding-bottom:.5em;  }\
					</style>\
					<form id="bcGmailSigsDonateForm" method="GET" action="https://addons.mozilla.org/en-US/firefox/addons/contribute/7757" target="_blank" style="background-color:#fff; width:500px; margin:auto; margin-top:10px; -moz-box-shadow:0 0 15px rgba(0, 0, 0, 0.5); -moz-border-radius:10px; border:1px solid black; padding:1em; font-size:small;">\
						<input type="hidden" value="addon-detail" name="source">\
						<h3 style="margin-top:0;">' + bcgs.getText('makeAContribution') + '</h3>\
						<p>' + bcgs.getText('helpSupportDetails') + '</p>\
						<h4>' + bcgs.getText('howMuchToContribute') + '</h4>\
						<ul style="list-style-type:none;">\
							<li onclick="document.getElementById(\'contrib-suggested\').checked = true;"><input type="radio" checked="checked" id="contrib-suggested" value="suggested" name="type">\
								<label for="contrib-suggested">' + bcgs.getText('oneTimeDefault') + ' $5.00</label></li>\
							<li onclick="document.getElementById(\'contrib-onetime\').checked = true; document.getElementById(\'onetime-amount-input\').focus()"><input type="radio" id="contrib-onetime" value="onetime" name="type">\
								<label>' + bcgs.getText('oneTimeAmount') + ' $ <input type="text" value="" name="onetime-amount" id="onetime-amount-input" style="width:4em;"></label></li>\
							<li onclick="document.getElementById(\'contrib-monthly\').checked = true; document.getElementById(\'monthly-amount-input\').focus();"><input type="radio" id="contrib-monthly" value="monthly" name="type">\
								<label for="contrib-monthly">' + bcgs.getText('monthlyContribution') + ' $ <input type="text" value="" name="monthly-amount" id="monthly-amount-input" style="width:4em;"></label></li>\
						</ul>\
						<label for="contrib-comment">' + bcgs.getText('leaveComment') + '</label> <span style="margin-left:2em;">(' + bcgs.getText('optional') + ')</span>\
						<textarea id="contrib-comment" name="comment" style="width:90%; margin:.5em 0; height:6em;"></textarea>\
						<input class="bcGmailSigsCommunityButton" type="submit" id="bcGmailSigsDonateSubmitButton" value="' + bcgs.getText('makeContribution') + '"/>\
						<a href="javascript:void(0)" id="bcGmailSigsCancelDonationButton" style="margin-left:5em;">' + bcgs.getText('noThanks') + '</a>\
					</form>';
				var activeElement = sigInst.gmail.getActiveElement();
				sigInst.$(activeElement).append(wrapper);
				sigInst.$('#bcGmailSigsCancelDonationButton', activeElement).click(sigInst.hideDonationBox);
				sigInst.$('#bcGmailSigsDonateForm', activeElement).submit(function() {
					setTimeout(sigInst.hideDonationBox, 1000);
				});
		};
		//---------------------- showSignatureEdit -------------
		this.showSignatureEdit = function() {
			var getButtonHtml =  sigInst.getButtonHtml;
			
				sigInst.getCurrentSignature(function(currentSig) {
					sigInst.hideSignatureEdit();
					sigInst.hideSignatureOptions();
					var activeElement = sigInst.gmail.getActiveElement();
					var editWrapper = sigInst.gmail.createElement('tr');
					editWrapper.id = "bcGmailSigsEditWrapper";
					for(var i = 0; i < 3; i++) {
						var td = sigInst.gmail.createElement('td');
						if(i != 1)
							td.innerHTML = '&nbsp;';
						else {
							td.setAttribute('style', 'padding:1em 0 .5em 0; font-size:12px;');
							var html = '<strong>' + bcgs.getText('signatureHtmlCode') + ':</strong> &nbsp;&nbsp; (' + bcgs.getText('dontKnowHtml') + ' <a href="http://blankcanvas.me/pages/detail/id_12/n_html_tutorials/" target="_blank">' + bcgs.getText('clickHereForTutorial') + '</a>)\
									<textarea id="bcGmailSigsEditSig" style="width:100%; height:200px; padding:.2em; font:small Arial,sans-serif; border:1px solid #979797; margin-top:.2em;"></textarea>\
									<div style="margin:.5em 0; text-align:right;" role="navigation">' +
										sigInst.getButtonHtml("bcGmailSigsSaveSigButton", 'Save', 'Save Current Signature') +
										(currentSig != '' ? sigInst.getButtonHtml("bcGmailSigsDeleteSigButton", 'Delete', 'Delete Current Signature') : '') +
										sigInst.getButtonHtml("bcGmailSigsCancelSigEditButton", 'Cancel', 'Cancel Changes') +
									'</div>\
									<div style="margin-top:-2em;"><strong>' + bcgs.getText('signaturePreview') + ':</strong></div>\
									<iframe id="bcGmailSigsPreviewFrame" style="border:none; width:100%; height:125px; padding:0; background-color:inherit;"/>';
							td.innerHTML = html;
						}
						sigInst.$(editWrapper).append(td);
					}
					sigInst.$('form table tr:eq(0)', activeElement).after(editWrapper);
					sigInst.$('#bcGmailSigsEditSig', activeElement).keyup(sigInst.updateSignaturePreview);
					sigInst.$('#bcGmailSigsCancelSigEditButton', activeElement).click(sigInst.hideSignatureEdit);
					sigInst.$('#bcGmailSigsDeleteSigButton', activeElement).click(function() {
						if(confirm(bcgs.getText('deleteSignatureConfirmation'))) {
							var editBox = sigInst.$('#bcGmailSigsEditSig', activeElement);
							if(editBox.size() == 1) editBox[0].innerHTML = '';
							sigInst.saveSignature();
						}			
					});
					sigInst.$('#bcGmailSigsSaveSigButton', activeElement).click(sigInst.saveSignature);
					sigInst.$('#bcGmailSigsPreviewFrame', activeElement).load(sigInst.updateSignaturePreview);
					sigInst.updateSignatureEditBox();
					sigInst.enableButtonMouseover();
				});
		}
		//---------------------- showSignatureOptions -------------
		this.showSignatureOptions = function() {
			
				var extensionPageUrl = "";
				var browser = com.BlankCanvas.BrowserDetect.browser;
				switch(browser) {
					case 'Firefox': extensionPageUrl = "https://addons.mozilla.org/en-US/firefox/addon/7757"; break;
					case 'Chrome': extensionPageUrl = "https://chrome.google.com/extensions/detail/ijdoblggemelaimffjccmdbmodlppofd"; break;
				}
				sigInst.hideSignatureEdit();
				sigInst.hideSignatureOptions();
				var activeElement = sigInst.gmail.getActiveElement();
				var optionsWrapper = sigInst.gmail.createElement('tr');
				optionsWrapper.id = "bcGmailSigsOptionsWrapper";
				for(var i = 0; i < 3; i++) {
					var td = sigInst.gmail.createElement('td');
					if(i != 1)
						td.innerHTML = '&nbsp;';
					else {
						td.setAttribute('style', 'padding:1em 0 .5em 0; font-size:12px;');
						td.innerHTML = '<div style="border:1px solid #aaa; padding:1em; background-color:#fff;">\
							<style type="text/css">\
								.bcGmailSigsCommunityButton { -moz-border-radius:16px; margin-left:.5em; padding:.5em .8em .5em .5em; font-weight:bold; color:#fff; text-decoration:none; line-height:2em; background-image:url(' + bcgs.images.contributeButtonBg + '); border:1px solid #3493FE; text-shadow:-1px -1px 1px #196CF2; cursor:pointer; }\
								.bcGmailSigsCommunityButton img { margin-right:.5em; border:none; vertical-align:middle; }\
								#bcGmailSigLabelOptionsWrapper input { width:6em; }\
							</style>\
							<div style="width:300px; float:right; text-align:right;">\
      							<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6PLFFJ96DFGZN" target="_blank" class="bcGmailSigsCommunityButton" id="bcGmailSigsDonateButton" title="' + bcgs.getText('donateTitle') + '">\
							       <nobr><img src="' + bcgs.images.whiteHeart + '">' + bcgs.getText('donate') + '</nobr></a>\
								<a href="http://www.facebook.com/pages/Blank-Canvas-Gmail-Signatures/254402756442" style="margin-left:1em;" target="_blank" title="' + bcgs.getText('followBcgsOnFacebook') + '"><img src="' + bcgs.icons.facebook + '" style="border:none; vertical-align:middle; height:30px;"/></a>\
								<a href="https://plus.google.com/100088243593341595846/" style="margin-left:.5em;" target="_blank" title="Follow on Google+"><img src="' + bcgs.icons.googlePlus + '" style="border:none; vertical-align:middle; height:30px;"/></a>\
								<a href="https://twitter.com/#!/BCGmailSigs" style="margin-left:.5em;" target="_blank" title="Follow on Twitter"><img src="' + bcgs.icons.twitter + '" style="border:none; vertical-align:middle; height:30px;"/></a>\
							</div>\
							<a href="https://plus.google.com/100088243593341595846/about" target="_blank">\
								<img src="' + bcgs.images.bcLogo + '" align="absmiddle" style="border:none; float:left; width:52px; margin-right:1em;" />\
							</a>\
							<div style="margin-top:10px; font-size:16px;"><strong>Blank Canvas Signatures for Gmail</strong></div>\
							<span style="font-size:11px; font-weight:normal;">' + bcgs.getText('developedBy') + ' <a href="http://profiles.google.com/JeromeDane" target="_blank">Jerome Dane</a></span>\
							<div style="width:220px; float:right; clear:left; padding-left:20px;">\
								<p><strong>' + bcgs.getText('usefulLinks') + '</strong></p>\
								<ul id="bcGmailSigsLinks" style="padding-left:20px;">\
									<li><a href="https://github.com/JeromeDane/Gmail-Signatures/blob/master/readme.md" target="_blank">' + bcgs.getText('projectHomePage') + '</a></li>\
									<li><a href="https://github.com/JeromeDane/Gmail-Signatures/issues" target="_blank">Issues / Bugs</a></li>\
									<li><a href="https://github.com/JeromeDane/Gmail-Signatures/blob/master/changelog.txt" target="_blank">' + bcgs.getText('versionHistory') + '</a></li>\
									<li><a href="https://github.com/JeromeDane/Gmail-Signatures/blob/master/license.txt" target="_blank">' + bcgs.getText('licenseAndUserAgreement') + '</a></li>\
								</ul>\
							</div>\
							<div style="margin:3em;">\
								<p><strong>' + bcgs.getText('signaturePosition') + '</strong>\
									<select id="bcGmailSigsSigPositionOption">\
										<option value="above">' + bcgs.getText('aboveQuotedText') +'</option>\
										<option value="below"' + (bcgs.getPref('sigPosition') == 'below' ? ' selected="Selected"' : '') + '>' + bcgs.getText('belowQuotedText') +'</option>\
									</select>\
								</p>\
								<p id="bcGmailSigLabelOptionsWrapper"><strong>' + bcgs.getText('signatureLabels') + '</strong>\
									<input type="text" id="bcGmailSigsLabel1Option" value="' + unescape(bcgs.getPref('label1')) + '"/>\
									<input type="text" id="bcGmailSigsLabel2Option" value="' + unescape(bcgs.getPref('label2')) + '"/>\
									<input type="text" id="bcGmailSigsLabel3Option" value="' + unescape(bcgs.getPref('label3')) + '"/>\
									<input type="text" id="bcGmailSigsLabel4Option" value="' + unescape(bcgs.getPref('label4')) + '"/>\
								</p>\
								<p><strong>' + bcgs.getText('showReinsertButton') + '</strong> <input type="checkbox" id="bcGmailSigsReinsertButtonOption"' +
									(bcgs.getPref('showReinsert') == 'true' ? ' checked="checked"' : '') +
								'/> - ' + bcgs.getText('showReinsertDesc') + '</p>\
								<p><strong>' + bcgs.getText('showRemoveButton') + '</strong> <input type="checkbox" id="bcGmailSigsRemoveButtonOption"' +
									(bcgs.getPref('showRemove') == 'true' ? ' checked="checked"' : '') +
								'/> - ' + bcgs.getText('showRemoveDesc') + '</p>\
								<p><strong>"Feedback" Button</strong> <input type="checkbox" id="bcGmailSigsFeedbackButtonOption"' +
									(bcgs.getPref('showFeedbackButton', 'true') == 'true' ? ' checked="checked"' : '') +
								'/> - show menu item to submit feedback</p>\
								<p><strong>"Donate" Button</strong> <input type="checkbox" id="bcGmailSigsDonateButtonOption"' +
									(bcgs.getPref('showDonateButton', 'true') == 'true' ? ' checked="checked"' : '') +
								'/> - show menu item to donate via PayPal</p>\
								<p><strong>' + bcgs.getText('storageMethod') + '</strong> <select id="bcGmailSigsStorageModeOption">\
										<option value="" title="' + bcgs.getText('storageMethodLocalDesc') + '">' + bcgs.getText('storageMethodLocal') + '</option>\
										<option value="bookmark"' + (bcgs.getPref('storageMethod') == 'bookmark' ? ' selected="selected"' : '') + ' title="' + bcgs.getText('storageMethodBrookmarkDesc') + '">' + bcgs.getText('storageMethodBrookmark') + '</option>\
									</select> - ' + bcgs.getText('storageMethodDesc') + '\
								</p>\
							</div>\
							<style type="text/css">\
								#bcGmailSigsLinks li { margin-bottom:.4em; }\
								#bcGmailSigsLinks li a { text-decoration:underline; color:#0033CC; }\
								#bcGmailSigsLinks li a:hover { text-decoration:none; }\
							</style>\
						</div>\
						<div style="text-align:right; margin-top:1em;">' + 
							sigInst.getButtonHtml('bcGmailSigsSaveOptionsButton', bcgs.getText('saveOptions'), 'Save Signature Options') +
							sigInst.getButtonHtml('bcGmailSigsSaveCancelButton', bcgs.getText('cancel')) +
						'</div>';
					}
					sigInst.$(optionsWrapper).append(td);
				}
				sigInst.$('form table tr:eq(0)', activeElement).after(optionsWrapper);
				sigInst.enableButtonMouseover();
				// sigInst.$('#bcGmailSigsDonateButton', activeElement).click(sigInst.showDonateBox);
				sigInst.$('#bcGmailSigsSaveCancelButton', activeElement).click(sigInst.hideSignatureOptions);
				sigInst.$('#bcGmailSigsSaveOptionsButton', activeElement).click(function(){
					sigInst.saveOptions();
					sigInst.hideSignatureOptions();
					sigInst.drawToolsForActiveView();
				});
				// hide storage options if not in Firefox
				/*
				if (com.BlankCanvas.BrowserDetect.browser != 'Firefox')	
					sigInst.$('#bcGmailSigsStorageModeOption').parent().hide();
				*/
		}
		//---------------------- updateSignatureEditBox -------------
		this.updateSignatureEditBox = function() {
				var activeElement = sigInst.gmail.getActiveElement();
				var editBox = sigInst.$('#bcGmailSigsEditSig', activeElement);
				if(editBox.size() == 1) {
					sigInst.getCurrentSignature(function(sig) {
						switch(com.BlankCanvas.BrowserDetect.browser) {
							case 'Firefox':
								editBox[0].innerHTML = sig;
								break;
							case 'Chrome':
								editBox[0].innerHTML = sig;
								editBox[0].value = sig;
								break;
						}
						sigInst.updateSignaturePreview();
					});		
				}
			
		}
		//---------------------- updateSignaturePreview -------------
		this.updateSignaturePreview = function() {
			var activeElement = sigInst.gmail.getActiveElement();
			var html = sigInst.$('#bcGmailSigsEditSig', activeElement).attr('value');
			var iframe = sigInst.$('#bcGmailSigsPreviewFrame', activeElement);
			if(iframe.size() == 1) {
				var iframeBody = iframe[0].contentDocument.body; 
				iframeBody.setAttribute('style', 'font-family:Arial,sans-serif; font-size:small; padding:.75em 0 0;');
				iframeBody.innerHTML = html;
			}
		};
		this.getButtonHtml = function(id, text, tooltip) {
			var ttHtml = typeof(tooltip) == 'undefined' ? '' : ' aria-label="' + tooltip + '" aria-haspopup="true" data-tooltip="' + tooltip + '"';
			return '<div id="' + id + '" class="T-I J-J5-Ji Bq lX T-I-ax7 L3 bcGmailButton" role="button" tabindex="2" style="-webkit-user-select: none; " ' + ttHtml + '>' + text + '</div>';
		};
		this.enableButtonMouseover = function() {
			sigInst.$('.bcGmailButton').mouseover(function() {
				this.className += ' T-I-JW';
			});
			sigInst.$('.bcGmailButton').mouseout(function() {
				this.className = this.className.replace(/\s*T-I-JW/, '');
			});
		};
		this.getSignatureButton = function() {
			if(typeof(sigInst.buttonWrapper) == 'undefined' || !sigInst.buttonWrapper) {
				var wrapper = sigInst.gmail.createElement('div');
				wrapper.id = 'bcSigButtonWrapper';
				wrapper.style.display = 'inline-block';
				wrapper.style.position = 'relative';
				wrapper = sigInst.$(wrapper);
				
				// create button
				var imgData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAd1JREFUeNpi/P//PwMlgAVELFq0iGRT4uLiGP0q95kxkusC79JdzZJivEVgA+bNm0e0KUlJSYwFrav+f2aSYLCz1fxPsgsc09d3KsoL51pZqXGevv8NEgbTp08naEpmZiZjauXC/wrSMgyGxsoMB659ZPj26ctfolywr4GVuf1250QJZd0kPRM1zmO3PjP8+PL177tbt7+DDZgwYQKGKQUFBYxQzUKMjMxvWTh4GK4LFDCseenN8OvrF4avd28y/Pz5LwanC4Aap4FczsTMyiBrnsIgpuXJcHF5MsP614H/tl/W/fb3z5+Mm7tzljKADEDHe+tZvC8sdvn/98d9IL73/8+X0/9/f9z7/8uzvf8PdQj/t/UsTYepZcEVzcKKlgx/Px9h+PV6CViAXTKP4dGxGQznHovNP7StayZMIRMuAwQVDBm+v9zB8OjCPQaG/+wMf3/9ZHh+efv3/CnXkpAVMmHxuzGvhLYcE/M/hodnjjJIauowsAgHMPz79wck/QtrXkADISJqzgyvb+5lUHJqYgD6lOHljdMM7+6fBicZYgzQ4hIQZ/j6+hrDjR09DB+fXnsBFNsEwk4Nv7eiKwZHY0lJCTwuRZkfMphybgBpuAbEO4CaDuJLZAABBgBp4uhVjBqx6wAAAABJRU5ErkJggg%3D%3D';
				var buttonHtml = '<img src="' + imgData + '" style="vertical-align:middle; margin-right:3px; "/> <span class="buttonLabel">' + unescape(bcgs.getPref('label1')) + '</span> <div class="G-asx J-J5-Ji">&nbsp;</div>';
				var html = sigInst.getButtonHtml('bcSigSelectorButton', buttonHtml, 'Signature');
				wrapper.append(html);
				var button = sigInst.$('div:first', wrapper);
				
				var optionsHtml = '';
				for(var i = 1; i < 5; i++) {
					if(typeof(sigInst.selectedSigType) == 'undefined') {
						var selectedTypeIndex = 0;
					} else {
						var selectedTypeIndex = typeof(sigInst.selectedSigType[sigInst.gmail.getFromAddress()]) != 'undefined' ? sigInst.selectedSigType[sigInst.gmail.getFromAddress()] : 0;
					}
					var isSelected = i == selectedTypeIndex + 1; 
					optionsHtml += '<div class="bcSigSelectType J-N' + (isSelected ? ' J-Ks-KO' : '') + '" id="bcSelectSigType' + i + '"' + (isSelected ? ' style="font-weight:bold;"' : '') + '>' + unescape(bcgs.getPref('label' + i)) + '</div>';
				}
				
				wrapper.append('<div class="J-M asi jQjAxd" style="position:absolute; top:29px; right:16px; -webkit-user-select: none; visibility: visible; display: none; " role="menu" aria-haspopup="true"><div class="SK AX" style="-webkit-user-select: none; ">' +
						'<div class="J-awr" style="-webkit-user-select: none; ">Select Signature:</div>' +
						optionsHtml + 
						'<div class="J-Kh" style="-webkit-user-select: none; " role="separator" id=":ug"></div>' +
						'<div class="J-N bcSigButtonEdit" role="menuitem" title="Edit selected signature" style="-webkit-user-select: none; "><div class="J-N-Jz" style="-webkit-user-select: none; ">Edit</div></div>' +
						(bcgs.getPref('showRemove') == 'true' ?
							'<div class="J-N bcSigButtonRemove" role="menuitem" title="Remove signature from current message" style="-webkit-user-select: none; "><div class="J-N-Jz" style="-webkit-user-select: none; ">Remove</div></div>'
							: ''
						) +
						(bcgs.getPref('showReinsert') == 'true' ?
							'<div class="J-N bcSigButtonReinsert" role="menuitem" title="Re-insert signature from into message" style="-webkit-user-select: none; "><div class="J-N-Jz" style="-webkit-user-select: none; ">Re-Insert</div></div>'
							: ''
						) +
						'<div class="J-N bcSigButtonOptions" role="menuitem" title="General signature options" style="-webkit-user-select: none; "><div class="J-N-Jz" style="-webkit-user-select: none; ">Options</div></div>' +
						(bcgs.getPref('showFeedbackButton', 'true') == 'true' ?
							'<div class="J-N" role="menuitem" title="Give feedback about this extension" style="-webkit-user-select: none; padding-left:0; padding-right:0;"><div class="J-N-Jz" style="-webkit-user-select: none;">' +
							'	<a href="https://github.com/JeromeDane/Gmail-Signatures/issues" target="_blank" style="display:block; text-decoration:none; color:inherit;">' +
							'		<img src="https://github.com/favicon.png" style="height:16px; width:16px; vertical-align:middle; position:relative; top:-2px; margin-left:6px; margin-right:5px;"/>' +
							'		Feedback' +
							'	</a>' +
							'</div></div>'
							: ''
						) +
						(bcgs.getPref('showDonateButton', 'true') == 'true' ?
							'<div class="J-N" role="menuitem" title="Support Blank Canvas Gmail Signatures" style="-webkit-user-select: none; padding-left:0; padding-right:0;"><div class="J-N-Jz" style="-webkit-user-select: none;">' +
							'	<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6PLFFJ96DFGZN" target="_blank" style="display:block; text-decoration:none; color:inherit;">' +
							'		<span style="padding-left: 11px; padding-right: 8px;">♥</span>' +
							'		Donate' +
							'	</a>' +
							'</div></div>'
							: ''
						) +
						'</div></div>');
				var menu = sigInst.$('div:first + div', wrapper);
				
				// enable option mouseover
				sigInst.$('.J-N', wrapper).mouseover(function() {
					this.className += ' J-N-JT';
				});
				sigInst.$('.J-N', wrapper).mouseout(function() {
					this.className = this.className.replace(/\s*J-N-JT/, '');
				});
				
				// show edit sig on click
				sigInst.$('.bcSigButtonEdit', menu).click(function() {
					menu.hide();
					sigInst.showSignatureEdit();
				});
				
				// remove sig options on click
				sigInst.$('.bcSigButtonRemove', menu).click(function() {
					menu.hide();
					sigInst.removeSignature();
				});
				
				// remove sig options on click
				sigInst.$('.bcSigButtonReinsert', menu).click(function() {
					menu.hide();
					sigInst.insertSignature();
				});
				
				// show sig options on click
				sigInst.$('.bcSigButtonOptions', menu).click(function() {
					menu.hide();
					sigInst.showSignatureOptions();
				});
				
				// show menu on button click
				button.click(function(e) {
					menu.show();
					// prevent document click so menu doesn't immediately close
					e.stopPropagation();
				});
				
				// prevent click event on document itself
				menu.click(function(e) {
					e.stopPropagation();
				});
				
				// hide menu when clicking anywhere else
				sigInst.$("body").click(function() {
					menu.hide();
				});
				
				sigInst.$('.bcSigSelectType', menu).click(function() {
					menu.hide();
					var i = parseInt(this.id.match(/\d+$/)[0]) - 1;
					sigInst.selectedSigType[sigInst.gmail.getFromAddress()] = i;
					sigInst.insertSignatureAndUpdateTools();
				});
				
				sigInst.buttonWrapper = wrapper;
			}
			
			return sigInst.buttonWrapper;
			
		};
		this.selectedSigType = {};
		// register view change handler
		this.gmail.registerViewChangeCallback(sigInst.viewChange);
			
}