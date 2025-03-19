async function scheduleHtmlProvider(dom = document) {
    let htmlContent = ''
    
    // 递归处理iframe/frame
    const processFrame = async (frames) => {
        for (const frame of frames) {
            try {
                const frameDoc = frame.contentDocument;
                htmlContent += await scheduleHtmlProvider(frameDoc)
            } catch (e) {
                console.warn(`框架访问受限：${frame.src}`)
            }
        }
    }
    
    // 同步处理当前文档主体
    htmlContent += dom.documentElement.outerHTML
    
    // 异步处理嵌套框架
    await processFrame(dom.querySelectorAll('iframe, frame'))
    
    return htmlContent
}