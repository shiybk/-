function scheduleHtmlParser(html) {
    const $ = cheerio.load(html, {decodeEntities: false})
    const course = []

    // 解析主课程表
    $('#mytable').first().find('tr').each(function() {
        const cols = $(this).find('td')
        if (cols.length < 8) return

        // 获取时间段元数据
        const timeMeta = $(this).find('td:contains("午")').text().trim()
        const periodType = timeMeta.includes("上") ? 0 : timeMeta.includes("下") ? 1 : 2

        cols.slice(2).each((i, el) => { // 从第三列开始遍历星期
            const day = i + 1
            $(el).find('div:has(font)').each(function() {
                const block = $(this).text().trim()
                const { name, teacher, weeks, sections, position } = parseCourseBlock(block)
                
                course.push({
                    name,
                    teacher,
                    position,
                    weeks,
                    day,
                    sections: generateSections(sections, periodType)
                })
            })
        })
    })

    return course

    // ========== 工具函数 ==========
    function parseCourseBlock(text) {
        const cleaned = text
            .replace(/(\s{2,}|[\t\n\r])/g, ' ') // 清除多余空白和换行[1](@ref)
            .replace(/$$.*?$$/g, match => {  // 修正后的正则表达式
                const sections = match.match(/\d+/g) || []
                return `[${sections.join('-')}]`
            })

        const [namePart, ...rest] = cleaned.split(/[\s\n]+/)
        const teacher = rest.find(t => /[\u4e00-\u9fa5]{2,}/.test(t)) || ''
        const position = rest.reverse().find(p => /楼|场/.test(p)) || ''

        return {
            name: cleanCourseName(namePart),
            teacher: teacher.replace(/(老师|教师)$/, ''),
            weeks: parseWeeks(rest.join('')),
            sections: parseSections(cleaned),
            position
        }
    }

    function cleanCourseName(name) {
        return name
            .replace(/^【.*?】/, '') // 去除课程编码[4](@ref)
            .replace(/（.*?）$/, '')
    }

    function parseWeeks(text) {
        const rangeMatch = text.match(/(\d+)-(\d+)(周)?(单|双)?/)
        if (!rangeMatch) return []
        
        const [_, start, end, , type] = rangeMatch
        return Array.from({length: end - start + 1}, (_, i) => +start + i)
            .filter(v => type === '单' ? v%2 : type === '双' ? !(v%2) : true)
    }

    function parseSections(text) {
        const sectionMatch = text.match(/$$(\d+)-(\d+)$$/) // 修正后的正则
        return sectionMatch 
            ? [parseInt(sectionMatch[1]), parseInt(sectionMatch[2])]
            : []
    }

    function generateSections([start, end], periodType) {
        const baseSections = {
            0: [1,2,3,4],   // 上午
            1: [5,6,7,8],   // 下午
            2: [9,10,11,12] // 晚上
        }
        return start && end 
            ? Array.from({length: end - start + 1}, (_, i) => start + i)
            : baseSections[periodType]
    }
}