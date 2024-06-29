//使用时修改关键词即可
var term = "【空白】"
function getarg(...args) {
	console.log("arg 0 is ", args[0])
	term = args[0]
}
getarg(input)
const files = app.vault.getMarkdownFiles()
const arr = files.map(
	async ( file) => {
		const content = await app.vault.cachedRead(file)
		if (content.contains("sum-report")) { //去除本页
		//	console.log("This is test file, bypass it: ", file.name)
			return []
		}

		const lines = content
//			.split("\n\n")
			.split(/\n[\ ]*\n/)
			.filter(line => line.contains(term))

		if (lines.length!=0) {

           var mmtime //=moment(file.stat.mtime).format('YYYY-MM-DD HH:mm:ss')
		   var regstr= term + '[\/_# \u4e00-\u9fa5]* +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})' 
			var regex = new RegExp(regstr,'g')
			//console.log("the regstr is", regstr)
			const retArr = lines.map(

			 (line) => {
				 //console.log("the line is", line)
				 regex.lastIndex = 0
				 let match = regex.exec(line)
				 if (match) {
				// console.log("matchlength:", match.length)
					// console.log("》Match the line is", line)
					// console.log("get the time is:", match[1]);
					 mmtime = " Tag Time: " + match[1] 
				 } else {
				//console.log("《 NoMatch the line is", line)			 
				mmtime=" Created Time: " + moment(file.stat.ctime).format('YYYY-MM-DD HH:mm:ss')
				 }
				 return [line + "\n\n【源自 " + "[[" +
						file.name.split(".")[0] + "]], *" + mmtime + "*】\n"]
			 }
			)
			/*
			const retArr = lines.map(
				(line) => {
					return [line + "\n\n【源自 " + "[[" +
						file.name.split(".")[0] + "]], *Last modified " + mmtime + "*】\n"]
			//		return [line + "\n\n【源自 " + "[[" +
			//			file.name.split(".")[0] + "]]】\n"]
				}
			)*/
			return retArr		
		} else {
			return []
		}
	}
)

function generateArray (start, end) { return Array.from(new Array(end + 1).keys()).slice(start) }
function getLineTime(line) {
	let regstr= 'Time: +(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})' 
	let regex = new RegExp(regstr,'g')
	 let match = regex.exec(line)
				 if (match) {
				// console.log("get the time is: ", match[1])
				// console.log(" the time is:", (new Date(match[1])).getTime())
				 return (new Date(match[1])).getTime()
				 } else 
				 return 0
}
Promise.all(arr).then(values => {

    let noteArr = values.flat()
	//console.log("Note Array size: " + noteArr.length)
	//console.log("before sort", noteArr)
	noteArr.sort((a,b)=> getLineTime(a) - getLineTime(b))
	//console.log("after sort", noteArr)
    dv.header(3,"显示【" + term + "】总共"+noteArr.length+"项")
    for(let i=0; i< noteArr.length;i++){
        // dv.paragraph("## " + (i+1) + "/" + noteArr.length + "\n" + `${noteArr[noteArr.length - 1 -i]}`)
        dv.paragraph("## " + (i+1) + "\n" + `${noteArr[noteArr.length - 1 -i]}`)
    }
})