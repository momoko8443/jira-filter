// ==UserScript==
// @name         JIRA Filter
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  try to take over the world!
// @author       You
// @match        https://atcswa-cr-atlassian.mcloud.entsvcs.com/jira/*
// @grant        none
// ==/UserScript==
// @require http://code.jquery.com/jquery-latest.js

(function() {
    'use strict';
    // Your code here...
    setTimeout(function(){
        $('#js-work-quickfilters').append('<dd><select id="assigneeSelect"><option value="all">--- all ---</option></select><dd>');
        $('#js-work-quickfilters').append('<dd id="pointsSummary"></dd>');
        $('#js-work-quickfilters').append('<button id="refreshBtn">refresh</button>');
        $('#refreshBtn').click(function(){
            refresh();
        });
        $('#assigneeSelect').change(function(){
            refresh();
        });
        function refresh(){
            var selectedAssignee = $('#assigneeSelect option:selected').val();
            $('.js-detailview').each(function(){
                if(selectedAssignee === 'all'){
                    $(this).show();
                    return;
                }else{
                    $(this).hide();
                }
            });
            $('[alt="Assignee:' + selectedAssignee +'"]').each(function(){
                $(this).parent().parent().show();
            });
            calculatePoints();
        }
        loadAssignees().then(function(list){
            for(var i in list){
                $('#assigneeSelect').append('<option value="'+list[i]+'">'+list[i]+'</option>');
            }
            calculatePoints();
        });

    },5000);
    function calculatePoints(){
        $('#pointsSummary').children('span').remove();
        loadAllStroyPoints().then(function(point){
            var totalPoints = point.process + point.done;
            var rate = Math.floor(point.done/totalPoints * 100) + '%';
            $('#pointsSummary').append('<span>&nbsp&nbsp Total: '+ totalPoints + ' p</span>');
            $('#pointsSummary').append('<span>, Done: '+ point.done + ' p</span>');
            $('#pointsSummary').append('<span>, In Progress: '+ point.process + ' p</span>');
            $('#pointsSummary').append('<span>, Rate: '+ rate + '</span>');
        });
    }
    function getDoneColumnID(){
        return new Promise(function(resolve, reject){
            $("#ghx-column-headers > li.ghx-column>h2").each(function(){
                var columnName = $(this).text();
                if(columnName === 'Done'){
                    var doneColumnID = $(this).parent().attr('data-id');
                    resolve(doneColumnID);
                }
            });
            reject();
        });
    }

    function loadAllStroyPoints(){
        return new Promise(function(resolve,reject){
            var donePoints = 0;
            var processPoints = 0;
            getDoneColumnID().then(function(doneColumnID){
                $("div::visible.js-detailview[data-issue-id]").each(function(){
                    var li = $(this).closest('li');
                    var columnID = li.attr('data-column-id');
                    if(columnID !== doneColumnID){
                        $(this).find('span[title="Story Points"]').each(function(){
                            processPoints += parseFloat($(this).text());
                        });
                    }else{
                        $(this).find('span[title="Story Points"]').each(function(){
                            donePoints += parseFloat($(this).text());
                        });
                    }
                });
                resolve({process:processPoints,done:donePoints});
            });
        });
    }

    function loadAssignees(){
        var assigneeList = [];
        var assigneeMap = {};
        return new Promise(function(resolve,reject){
            $('.ghx-avatar-img').each(function(){
                var assignee = $(this).attr('alt').split(':')[1];
                if(!assigneeMap[assignee]){
                    assigneeList.push(assignee);
                    assigneeMap[assignee] = true;
                }
            });
            resolve(assigneeList);
        });
    }
})();
