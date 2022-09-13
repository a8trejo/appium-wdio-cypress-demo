class Playground {
    get prefillQuery() {
        return "//android.widget.TextView[@content-desc='Prefill query: ']/following-sibling::android.widget.EditText[1]";
    };
    
    _menuOption (option) {
        switch(option){
            case 'appMenu': return '//android.widget.TextView[@content-desc="App"]'
            case 'searchMenu': return '//android.widget.TextView[@content-desc="Search"]'
            default: return `//android.widget.TextView[@content-desc="${option}"]`;
        }
    };
}
module.exports = new Playground ();
