class Scheme(object):
    def __init__(self, scheme):
        self.errors = []
        self.scheme = scheme
        self.scheme_code = self.scheme["scheme_code"]

    def validate(self):
        self.check_existence("title", "Missing title node")
        self.check_existence("proofs", "Missing proofs node")
        self.check_existence("ord", "Missing ord node")
        self.check_existence("features", "Missing features node")
        self.check_existence("introductory_notes_file", "Missing introductory_notes_file node")
        self.check_existence("fta_intro_file", "Missing fta_intro_file node")
        self.check_existence("links", "Missing links node")
        self.check_existence("countries", "Missing countries node")
        self.check_existence("cumulation_methods", "Missing cumulation_methods node")
        self.check_existence("ord", "Missing ord node")
        self.check_existence("articles", "Missing articles node")
        self.check_existence("features", "Missing features node")
        self.check_existence("introductory_notes_file", "Missing introductory_notes_file node")
        self.check_existence("links", "Missing links node")
        self.check_existence("countries", "Missing countries node")
        return self.return_values()

    def check_existence(self, node, error_message):
        try:
            node = self.scheme[node]
        except Exception as e:
            self.errors.append(error_message)

    def return_values(self):
        # Return the values
        if len(self.errors) > 0:
            ret = {
                "scheme": self.scheme_code,
                "errors": self.errors
            }
        else:
            ret = None
        return ret
