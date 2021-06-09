var fields = {
  paid: 0,
  created_at: 1,
  name: 2,
  phone: 3,
  date: 4,
  time: 5,
  cake: [6, 7],
  letter: 8,
  taste: [10, 11, 12, 13],
  inner_taste: [14],
  bottom_taste: [15],
  size: 18,
  shape: [19, 20],
  color: [9, 16],
  sentence: 25,
  paid_sentence: [26, 27],
  toppings: 21,
  decorations: [22, 23, 24],
  social_name: 28,
  order_from: 29,
  delivery_method: 30,
  delivery_address: 31,
  remarks: 32,
  printed: 90,
  index: 91,
};

const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)

function lineIf(o, fields, opt) {
  const line = (
    fields
    .map(function(f, i) {
      if (opt && opt.overrides && opt.overrides[i]) {
        return opt.overrides[i](o[f], o)
      }
      if (o[f] instanceof Date) {
        return (o[f].getMonth() + 1) + '/' + o[f].getDate();
      }
      if (['shape', 'color', 'taste', 'letter', 'delivery_method'].includes(f)) {
        if (o[f] && o[f].replace) {
          return o[f].replace(/\([^(\))]*\)/g, '')
        }
        return o[f]
      }

//      if (f === 'decorations') {
//        if (o[f] && o[f].replace) {
//          return o[f].replace(/\([^(\))]*\)/g, '')
//        }
//      }
      return o[f]
    })
    .filter(Boolean)
    .join(' ')
  )
  return (
      line.trim().length > 0 ? ((opt && opt.prefix) || '') + line.trim() + '\n' : ''
  );
}
function stylePattern(body, pattern, opt) {
  var range = body.findText(pattern);

  while (range !== null) {
    var text = range.getElement().asText();
    
    if (opt.background) {
      text.setBackgroundColor(range.getStartOffset(), range.getEndOffsetInclusive(), opt.background)
    }
    
    if (opt.underline) {
      text.setUnderline(range.getStartOffset(), range.getEndOffsetInclusive(), opt.underline)
    }
    
    if (opt.bold) {
      text.setBold(range.getStartOffset(), range.getEndOffsetInclusive(), opt.bold)
    }

    range = body.findText(pattern, range);
  }
}

function order2Str(order) {
  if (!order) return '';
  return (
    ((order['printed'] === true || order['printed'] === 'TRUE') ? '' : 'NEW\n') +
    lineIf(order, ['index', 'hash'], { prefix: '#', overrides: [undefined, (_, o) => hashCode(JSON.stringify(o)) ] }) +
//    lineIf(order, ['paid'], {overrides: [function(val) {return ((val === true || val === 'TRUE') ? 'Paid' : 'NOT Paid')}]}) +
    lineIf(order, ['name', 'phone'], {prefix: '👨 '}) +
    lineIf(order, ['date', 'time'], {prefix: '🕐 '}) +
    lineIf(order, ['cake', 'size'], {prefix: '🎂 '})+
    lineIf(order, ['decorations', 'toppings'], {prefix: '📿 '})+
    lineIf(order, ['shape', 'color'], {prefix: '‎‎‎⠀⠀ '})+
    lineIf(order, ['taste', 'letter'], {prefix: '‎‎⠀⠀ '})+
    lineIf(order, ['inner_taste', 'bottom_taste'], {prefix: '‎‎⠀⠀ '})+
    lineIf(order, ['sentence'], {prefix: '✍️️ '})+
    lineIf(order, ['paid_sentence'], {prefix: '朱古力牌 ✍️️ '})+
    lineIf(order, ['order_from', 'social_name'], {prefix: '📲 '})+
    lineIf(order, ['delivery_method', 'delivery_address'], {prefix: '🚚 '})+
    lineIf(order, ['remarks'])
  )
}

function get(row, col) {
  return [].concat(fields[col]).reduce(function(acc, c) {
    var res = row[c]
    if (col === 'time') {
      if (res instanceof Date) {
        res = res.getHours() + ':' + res.getMinutes()
      }
    }
    
    return acc ? `${acc}, ${res}` : res;
  }, '')
}

function exportAllOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({date: date})
}

function exportUnprintedOrdersOfTmwTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 2)

  exportOrders({unprintedOnly: true, date: date})
}

function exportAllOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
                
  exportOrders({date: date})
}

function exportUnprintedOrdersOfTmw() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  
  exportOrders({unprintedOnly: true, date: date})
}

function exportCustomOrders() {
  const [month, day] = Browser.inputBox('Orders Date', 'MM/DD', Browser.Buttons.OK_CANCEL).split('/').map(function(t) {return 0 + t});
  
  exportOrders({date: new Date(new Date().getYear(), month - 1, day)})
}

const resolveColumnIndex = (n) => (a=Math.floor(n/26)) >= 0 ? resolveColumnIndex(a-1) + String.fromCharCode(65+(n%26)) : '';

function exportOrders(filter, {output, numOfColumns = 2, unrecorded} = {}) {
  filter.paidOnly = true // Print only paid orders for now
  var sheet = SpreadsheetApp.getActiveSheet();
  
  let date = filter.date
  
  let month, day, year
  
  let reportName;
  if (date) {
    [month, day, year] = [date.getMonth() + 1, date.getDate(), date.getFullYear()]
    reportName = 'Orders for ' + month + '/' + day + (filter.paidOnly ? ' (Paid)' : ' (All)')
  }
  if (filter.index) {
    reportName = `Order for ${filter.index}`;
  }
  
  var data = (
    sheet.getDataRange().getValues()
      .map(function(o, index) {o.id = index; return o})
      .filter(function(o) {
        if (!filter.date) {
          return true;
        }
        
        
        var odate = get(o, 'date') || ''
        if (odate instanceof Date) {
          return odate.getMonth() + 1 == month && odate.getDate() == day
        }
        return (odate.replace('\'', '').trim() == month + '/' + day) || (odate.replace('\'', '').trim() == month + '/' + day + '/' + year)
      })
//      .filter(function(o) {return (!filter.unprintedOnly) || !(get(o, 'printed') === 'TRUE' || get(o, 'printed') === true)})
      .filter(function(o) {return (!filter.paidOnly) || typeof get(o, 'paid') === 'string' ? 'TRUE' == get(o, 'paid') : get(o, 'paid') }) // paid
  );
  
  const orders = []

  //Logger.clear();
  let this_day_has_printed_before = false;
  data.forEach(function(row) {
    const order = {}
    order.id = row.id
    Object.keys(fields).forEach(function (col) {
      var val = get(row, col)
      if (val.replace /*col === 'decorations'*/) {
        val = val
          .replace(/\(\+(\ *?)\$(\d|\.)*\)/g, '') // e.g. (+ $20)
          .replace(/\*\(推介\)(\ *)?/g, '')
          .replace(/\(FREE\)(\ *)?/g, '')
          .replace(/⚠.*⚠/g, '\n')
      }
      
      if (val) {
        order[col] = val
      }
     
    })
    if (order.printed) {
      this_day_has_printed_before = true;
    }
    if (filter.index && String(order.index) !== String(filter.index)) {
      return;
    }
    orders.push(order)
  })
  
//  if (!this_day_has_printed_before || true) {
  if (!unrecorded) {
    orders.forEach((order, index) => {
      if (order.paid) {
        sheet.getRange(resolveColumnIndex(fields.printed) + (order.id + 1)).setValue(true)
      }
    })
  }
  
  var doc = DocumentApp.create(reportName)
  
  var paper = {
     letter_size:[612.283,790.866], 
     tabloid_size:[790.866,1224.57],
     legal_size:[612.283,1009.13],
     statement_size:[396.85,612.283],
     executive_size:[521.575,756.85],
     folio_size:[612.283,935.433],
     a3_size:[841.89,1190.55],
     a4_size:[595.276,841.89],
     a5_size:[419.528,595.276],
     b4_size:[708.661,1000.63],
     b5_size:[498.898,708.661]};

const numOfColumnsToPaper = {
  1: 'a5_size',
  2: 'a4_size'
}

const paperSize = paper[numOfColumnsToPaper[numOfColumns]]



  
  var body = doc.getBody()
  if (paperSize) {
    body.setPageHeight(paperSize[1]).setPageWidth(paperSize[0])
  }
  body.editAsText().setFontSize(21)
  body.setMarginBottom(0); body.setMarginTop(0);
  body.setMarginLeft(0); body.setMarginRight(0);
  const cellsPerPage = 4;
  orders.forEach(function(o, i) {
    if (i % cellsPerPage != 0) return;
    
    const rows = [];
    

    for (let offset = 0; offset < cellsPerPage; offset++) {
      Logger.log(orders[i].index)
      if (offset % numOfColumns === 0) {
        rows.push([]);
      }
      rows[rows.length - 1].push(order2Str(orders[i + offset]) || '')

    }
    var table = body.appendTable(rows)
    body.appendPageBreak()
  })
  
  stylePattern(body, '#\d+', {bold: true})
  stylePattern(body, '(NOT )?Paid', {bold: true})
  stylePattern(body, '\d{8}', {bold: true})
//  stylePattern(body, '蠟燭', {background: '#ff0000'})
//  stylePattern(body, '蠟燭刀叉碟套裝', {background: '#ffffff'})
//  stylePattern(body, '.*(糕|餅)\ \d+.*', {bold: true})
//  stylePattern(body, '生日插牌', {background: '#00ff00'})
  stylePattern(body, '寫名.*', {underline: true})
  
  doc.saveAndClose()
  
  var docRef = DriveApp.getFileById(doc.getId())
  var dailyFolder = DriveApp.getFoldersByName('Daily').next()
  dailyFolder.addFile(docRef)
  DriveApp.removeFile(docRef)
  
  var pdfRef = DriveApp.createFile(doc.getAs('application/pdf'))
  dailyFolder.addFile(pdfRef)
  pdfRef.setName(reportName)
  DriveApp.removeFile(pdfRef)
  pdfRef.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW)
  
  if (output === 'html') {
    return ContentService.createTextOutput(pdfRef.getDownloadUrl().replace('&gd=true','')
      )
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  
  if (output === 'json') {
    return ContentService.createTextOutput(JSON.stringify({
      'url': pdfRef.getDownloadUrl().replace('&gd=true','')
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var html = HtmlService.createHtmlOutput('<a target=\"_blank\" href=\"' + pdfRef.getDownloadUrl().replace('&gd=true','') + '\">Download</a>')
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Download');
}

function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  const tmw = new Date()
  tmw.setDate(tmw.getDate() + 1)
  var tmwTmw = new Date(new Date().setDate(new Date().getDate() + 2));
//  const tmwTmw = new Date()
//  tmwTmw.setDate(tmwTmw.getDate() + 2)
  
  const [month, day] = [tmw.getMonth() + 1, tmw.getDate()] // tomorrow
  const [month1, day1] = [tmwTmw.getMonth() + 1, tmwTmw.getDate()] // tomorrow
  var marbleMenuEntries = [
//    {name: "Export " + month + '/' + (day) + " orders (All)", functionName: "exportAllOrdersOfTmw"},
    {name: "Export " + month + '/' + (day) + " orders (All) (Unprinted)", functionName: "exportUnprintedOrdersOfTmw"},
    {name: "Export " + month1 + '/' + (day1) + " orders (All)", functionName: "exportAllOrdersOfTmwTmw"},
    {name: "Export Custom orders", functionName: "exportCustomOrders"},
    {name: "Increment field", functionName: "autoIncrement"},
  ];
  ss.addMenu("Marble", marbleMenuEntries);
};
    
function installableOnEdit(event) {
  autoIncrement();
//    mutateOnEditEvent(event);
}
    
function makeAPICall(key, query, variables) {
  //var urls = ["https://64619deb.ngrok.io/", "https://api-marblez.herokuapp.com/"];
  var urls = ["https://efc10c8e.ngrok.io/"];
  var options = {
    "method" : "post",
    "headers" : {
      "Authorization" : key,
    },
    "payload" : JSON.stringify({
      "query" : query,
      "variables" : variables
    }),
    "contentType" : "application/json"
  };
  const requests = urls.map(url => ({ url, ...options }));
  var response = UrlFetchApp.fetchAll(requests);
  return response;
}


function mutateOnEditEvent(event){
    const row = event.range.getRow();
    const column = event.range.getColumn();
    const query = `
    mutation($editEvent: EditEventInput!) {
        onOrderGoogleSheetEditEvent(editEvent: $editEvent) {
            orders {
                phone
            }
            event
        }
    }
    `;
    const variables = {
    editEvent: {
    column,
    row,
    oldValue: event.oldValue,
    value: event.value,
    }
    }
    
    makeAPICall('', query, variables);
}

function doGet({ parameter = {} } = {}) {
  return exportOrders({
    unprintedOnly: true,
    date: parameter.date ? new Date(parameter.date) : null, 
    index: parameter.index,
  }, {
    output: 'json',
    numOfColumns: parameter.num_of_columns || 1,
    unrecorded: true,
  })
}
    

function autoIncrement() {
  var AUTOINC_COLUMN = fields.index; // After printed column
  var HEADER_ROW_COUNT = 1;
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var worksheet   = spreadsheet.getActiveSheet();
  var rows        = worksheet.getDataRange().getNumRows();
  var vals        = worksheet.getSheetValues(1, 1, rows+1, 2);
    
  Logger.clear()
  Logger.log(rows)
  Logger.log(vals.toString())
    
  worksheet.getRange(HEADER_ROW_COUNT, AUTOINC_COLUMN+1).setValue('Index')
  
  for (var row = HEADER_ROW_COUNT; row < vals.length; row++) {
    try {
      var id = vals[row][AUTOINC_COLUMN];
//      Logger.log(id);Logger.log((""+id).length ===0);
      if (id === undefined) {
        // Here the columns & rows are 1-indexed
        worksheet.getRange(row+1, AUTOINC_COLUMN+1).setValue(row + 1);
      }
    } catch(ex) {
      // Keep calm and carry on
    }
  }
}
