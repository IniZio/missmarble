//var fields = {
//  paid: 0,
//  name: 2,
//  phone: 3,
//  date: 4,
//  time: 5,
//  cake: 6,
//  letter: 7,
//  taste: [9, 10],
//  size: 11,
//  shape: [12, 13],
//  color: 14,
//  sentence: 15,
//  decorations: 16,
//  social_name: 17,
//  order_from: 18,
//  delivery_method: 19,
//  remarks: 20
//};
//
//var reserved = ['paid']
//
//function get(row, col) {
//  return [].concat(fields[col]).reduce(function(acc, c) {
//    return row[c] || acc
//  }, '')
//}
//
//function exportOrdersOfToday() {
//  var sheet = SpreadsheetApp.getActiveSheet();
//  const date = new Date()
//  const [month, day] = [date.getMonth() + 1, date.getDate() + 2] // day after tomorrow
//  
//  var data = (
//    sheet.getDataRange().getValues()
//      .filter(function(o) {return get(o, 'date') == month + '/' + day})
//      .filter(function(o) {return get(o, 'paid')}) // paid
//  );
//  
//  const orders = []
//  const orderStrs = []
//  
//  Logger.clear();
//  data.forEach(function(row) {
//    const order = {}
//    var str = ''
//    Object.keys(fields).forEach(function (col) {
//      var val = get(row, col)
//      if (col === 'decorations') {
//        val = val
//          .replace(/\(\+\ *?\$(\d|\.)*\)/g, '') // e.g. (+ $20)
//          .replace(/\*\(推介\)\ *?/g, '')
//      }
//      
//      if (val) {
//        order[col] = val
//        if (reserved.indexOf(col) < 0) {
//          str += order[col] + '\n'
//        }
//      }
//    })
//    orders.push(order)
//    orderStrs.push(str)
//  })
//  
//  Logger.log(JSON.stringify(orderStrs))
//  
//  var doc = DocumentApp.create('Orders for ' + month + '/' + day)
//
//  DocumentApp.getDownload
//  
//  var body = doc.getBody()
//  body.editAsText().setFontSize(17)
//  body.setMarginBottom(0); body.setMarginTop(0);
//  var cells = []
//  orderStrs.forEach(function(o, i) {
//    if (i % 4 != 0) return;
//    var table = body.appendTable([
//      [orderStrs[i], orderStrs[i + 1] || ''],
//      [orderStrs[i + 2] || '', orderStrs[i + 3] || '']
//    ])
//    body.appendPageBreak()
//  })
//  
//  doc.saveAndClose()
//  
//  var docRef = DriveApp.getFileById(doc.getId())
//  var dailyFolder = DriveApp.getFoldersByName('Daily').next()
//  dailyFolder.addFile(docRef)
//  DriveApp.removeFile(docRef)
//  
//  var pdfRef = DriveApp.createFile(doc.getAs('application/pdf'))
//  dailyFolder.addFile(pdfRef)
//  pdfRef.setName('Orders for ' + month + '/' + day)
//  DriveApp.removeFile(pdfRef)
//  
//  var ui = UiApp.createApplication().setTitle("Download");
//  var p = ui.createVerticalPanel();
//  ui.add(p);
//  p.add(ui.createAnchor("Download", pdfRef.getDownloadUrl().replace('&gd=true','')));
//  SpreadsheetApp.getActive().show(ui)
//}
//
//function onOpen() {
//  var ss = SpreadsheetApp.getActiveSpreadsheet();
//  const date = new Date()
//  const [month, day] = [date.getMonth() + 1, date.getDate() + 2] // day after tomorrow
//  var marbleMenuEntries = [ {name: "Export " + month + '/' + day + " orders", functionName: "exportOrdersOfToday"} ];
//  ss.addMenu("Marble", marbleMenuEntries);
//};
